<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\ParentTeacherMessage;
use App\Models\User;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    /**
     * GET /api/chat/threads
     * Query params: classroomId
     * Returns student threads in the classroom with latest message and unread count
     */
    public function getThreads(Request $request)
    {
        $request->validate([
            'classroomId' => 'required|string',
        ]);

        $classroomId = strtoupper(trim($request->query('classroomId')));

        $classroom = Classroom::where('classroom_id', $classroomId)->first();
        if (!$classroom) {
            return response()->json(['error' => 'Classroom not found.'], 404);
        }

        $messages = ParentTeacherMessage::where('classroom_id', $classroomId)
            ->orderBy('created_at', 'desc')
            ->get();

        $threads = [];
        $grouped = $messages->groupBy('student_id');

        foreach ($grouped as $studentId => $msgs) {
            $latest = $msgs->first();
            $unreadCount = $msgs->where('sender_role', 'parent')->whereNull('read_at')->count();

            $student = User::where('user_id', $studentId)->first();
            $studentName = $student ? $student->name : (string) $studentId;

            $threads[] = [
                'studentId' => (string) $studentId,
                'studentName' => $studentName,
                'latestMessage' => $latest->is_unsent ? 'This message was unsent' : $latest->message_body,
                'latestSenderRole' => $latest->sender_role,
                'latestSenderName' => $latest->sender_name,
                'latestTimestamp' => $latest->created_at ? $latest->created_at->toISOString() : null,
                'latestIsUnsent' => (bool) $latest->is_unsent,
                'latestEditedAt' => $latest->edited_at ? $latest->edited_at->toISOString() : null,
                'unreadCount' => $unreadCount,
            ];
        }

        return response()->json([
            'success' => true,
            'classroomId' => $classroomId,
            'teacherName' => $classroom->teacher_name,
            'consultationHours' => $classroom->consultation_hours,
            'threads' => $threads,
        ]);
    }

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
            if ($student) {
                $receiverId = $student->parent_user_id ?? $student->parent_access_token;
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
     * POST /api/chat/edit
     * Body: messageId, messageBody
     */
    public function editMessage(Request $request)
    {
        $request->validate([
            'messageId' => 'required|integer',
            'messageBody' => 'required|string|max:1000',
        ]);

        $messageId = $request->input('messageId');
        $newBody = trim($request->input('messageBody'));

        $msg = ParentTeacherMessage::find($messageId);
        if (!$msg) {
            return response()->json(['error' => 'Message not found.'], 404);
        }

        if ($msg->is_unsent) {
            return response()->json(['error' => 'Cannot edit an unsent message.'], 422);
        }

        // Validate 30-minute edit window
        $diffMinutes = $msg->created_at->diffInMinutes(now(), false);
        if ($diffMinutes > 30) {
            return response()->json([
                'error' => 'Messages can only be edited within 30 minutes of sending.',
                'minutesElapsed' => $diffMinutes,
            ], 422);
        }

        // Preserve original text on first edit
        if ($msg->original_message_body === null) {
            $msg->original_message_body = $msg->message_body;
        }

        // Maintain edit history
        $history = $msg->edit_history ?? [];
        $history[] = [
            'previous_body' => $msg->message_body,
            'edited_at' => now()->toISOString(),
        ];

        $msg->message_body = $newBody;
        $msg->edit_history = $history;
        $msg->edited_at = now();
        $msg->save();

        return response()->json([
            'success' => true,
            'message' => $msg,
        ]);
    }

    /**
     * POST /api/chat/unsend
     * Body: messageId
     */
    public function unsendMessage(Request $request)
    {
        $request->validate([
            'messageId' => 'required|integer',
        ]);

        $messageId = $request->input('messageId');

        $msg = ParentTeacherMessage::find($messageId);
        if (!$msg) {
            return response()->json(['error' => 'Message not found.'], 404);
        }

        $msg->is_unsent = true;
        $msg->unsent_at = now();
        $msg->save();

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
