<?php

namespace App\Http\Controllers;

use App\Models\RateLimitConfig;
use App\Models\AiGenerationLog;
use Illuminate\Http\Request;

class RateLimitController extends Controller
{
    // GET /api/dev/rate-limits
    public function index()
    {
        $configs = RateLimitConfig::orderBy('role')->get();
        return response()->json($configs);
    }

    // PUT /api/dev/rate-limits/{role}
    public function upsert(Request $request, string $role)
    {
        $data = $request->validate([
            'max_requests'   => 'required|integer|min:1|max:1000',
            'window_minutes' => 'required|integer|min:1|max:1440',
            'is_enabled'     => 'required|boolean',
            'notes'          => 'nullable|string|max:500',
        ]);

        $config = RateLimitConfig::updateOrCreate(
            ['role' => $role],
            $data
        );

        return response()->json($config);
    }

    // DELETE /api/dev/rate-limits/{role}
    public function destroy(string $role)
    {
        RateLimitConfig::where('role', $role)->delete();
        return response()->json(['success' => true]);
    }

    // GET /api/dev/rate-limits/usage
    // Returns per-user usage counts within each role's active window
    public function usage()
    {
        $configs = RateLimitConfig::where('is_enabled', true)->get()->keyBy('role');

        $results = [];
        foreach ($configs as $role => $config) {
            $since = now()->subMinutes($config->window_minutes);

            $rows = AiGenerationLog::where('role', $role)
                ->where('generated_at', '>=', $since)
                ->selectRaw('user_id, COUNT(*) as count')
                ->groupBy('user_id')
                ->with('user:id,name,email')
                ->get();

            $results[] = [
                'role'           => $role,
                'max_requests'   => $config->max_requests,
                'window_minutes' => $config->window_minutes,
                'users'          => $rows->map(fn ($r) => [
                    'user_id' => $r->user_id,
                    'name'    => optional($r->user)->name,
                    'email'   => optional($r->user)->email,
                    'count'   => $r->count,
                    'over_limit' => $r->count >= $config->max_requests,
                ]),
            ];
        }

        return response()->json($results);
    }
}
