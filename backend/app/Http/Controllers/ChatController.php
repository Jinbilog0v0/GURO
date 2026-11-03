<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\ParentTeacherMessage;
use App\Models\User;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    /**
     * GET /api/chat/messages
     * Query params: classroomId, studentId
     */
    public function getMessages(Request $request)
    {
        $request->validate([
            'classroomId' => 'required|string',
            'studentId' => 'required|string',
        ]);

        $classroomId = strtoupper(trim($request->query('classroomId')));
        $studentId = trim($request->query('studentId'));

        $classroom = Classroom::where('classroom_id', $classroomId)->first();
        if (!$classroom) {
            return response()->json(['error' => 'Classroom not found.'], 404);
        }

        $messages = ParentTeacherMessage::where('classroom_id', $classroomId)
            ->where('student_id', $studentId)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'classroomId' => $classroomId,
            'studentId' => $studentId,
            'teacherName' => $classroom->teacher_name,
            'consultationHours' => $classroom->consultation_hours,
            'messages' => $messages,
        ]);
    }

    /**
     * POST /api/chat/send
     * Body: classroomId, studentId, messageBody, senderRole, senderName, senderId
     */
    public function sendMessage(Request $request)
    {
        $request->validate([
            'classroomId' => 'required|string',
            'studentId' => 'required|string',
            'messageBody' => 'required|string|max:1000',
            'senderRole' => 'required|in:teacher,parent,admin',
            'senderName' => 'required|string',
        ]);

        $classroomId = strtoupper(trim($request->input('classroomId')));
        $studentId = trim($request->input('studentId'));
        $messageBody = trim($request->input('messageBody'));
        $senderRole = $request->input('senderRole');
        $senderName = $request->input('senderName');
        $senderId = $request->input('senderId') ?? ($request->user() ? $request->user()->user_id : 'anonymous');

        $classroom = Classroom::where('classroom_id', $classroomId)->first();
        if (!$classroom) {
            return response()->json(['error' => 'Classroom not found.'], 404);
        }

        $receiverId = null;
        if ($senderRole === 'parent') {
            $receiverId = $classroom->teacher_user_id;
        } else {
            // Find parent user linked to student
            $student = User::where('user_id', $studentId)->first();
            if ($student && $student->parent_access_token) {
                $receiverId = $student->parent_access_token;
            }
        }

        $msg = ParentTeacherMessage::create([
            'classroom_id' => $classroomId,
            'student_id' => $studentId,
            'sender_id' => (string) $senderId,
            'sender_name' => $senderName,
            'sender_role' => $senderRole,
            'receiver_id' => (string) $receiverId,
            'message_body' => $messageBody,
        ]);

        return response()->json([
            'success' => true,
            'message' => $msg,
        ]);
    }

    /**
     * POST /api/chat/mark-read
     */
    public function markRead(Request $request)
    {
        $request->validate([
            'messageIds' => 'required|array',
        ]);

        ParentTeacherMessage::whereIn('id', $request->input('messageIds'))
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }
}
