import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { Bell, Check, MessageSquare, Send } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { markNotificationRead, sendChatMessage } from '../services/campusgigService';
import { ChatMessage, formatIst } from '../types/campusgig';

export function MessagesNotificationsPage() {
  const { firebaseUser, userPublic } = useAuth();
  const { notifications, conversations } = useData();

  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const selectedConv =
    conversations.find((c) => c.id === selectedConvId) || conversations[0] || null;

  useEffect(() => {
    if (!firebaseUser || !firebaseUser.emailVerified || !selectedConv) {
      setMessages([]);
      return;
    }

    const msgPath = `conversations/${selectedConv.id}/messages`;
    const q = query(collection(db, 'conversations', selectedConv.id, 'messages'), orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, msgPath)
    );

    return unsub;
  }, [firebaseUser, selectedConv?.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !firebaseUser || !userPublic || !draft.trim()) return;
    setSending(true);
    try {
      await sendChatMessage(selectedConv, firebaseUser.uid, userPublic.displayName, draft);
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  return (
    <AppLayout title="Notifications & Messages">
      {!firebaseUser ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Sign in to view notifications and task conversations
          </p>
          <Link
            to="/auth"
            className="mt-4 inline-flex px-4 py-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white text-xs font-semibold hover:bg-violet-800 dark:hover:bg-violet-500 transition-colors"
          >
            Sign In
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Notifications */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col max-h-[640px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
                <Bell className="w-4 h-4 text-violet-700 dark:text-violet-400" />
                Notifications ({notifications.length})
              </h2>
            </div>

            {notifications.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-10 text-center">
                No notifications yet. You will receive updates on applications, task acceptance,
                completion, and payouts.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto flex-1">
                {notifications.map((n) => (
                  <div key={n.id} className="py-3.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={n.linkPath || '/dashboard'}
                        onClick={() => {
                          if (!n.isRead) markNotificationRead(n.id);
                        }}
                        className="text-xs font-bold text-slate-900 dark:text-slate-100 hover:text-violet-700 dark:hover:text-violet-400"
                      >
                        {n.title}
                      </Link>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {n.body}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                        {formatIst(n.createdAt)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => markNotificationRead(n.id)}
                        className="p-1.5 rounded-lg text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/50 shrink-0"
                        title="Mark as read"
                        aria-label="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Task-Scoped Messaging */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col min-h-[500px] max-h-[640px]">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-violet-700 dark:text-violet-400" />
                Task Messages
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Accessible only to assigned task participants
              </span>
            </div>

            {conversations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  No active task chats yet
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  A private task conversation opens automatically once a poster selects a student
                  worker for a gig.
                </p>
              </div>
            ) : (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
                {/* Conversation List */}
                <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 overflow-y-auto">
                  {conversations.map((conv) => {
                    const active = selectedConv?.id === conv.id;
                    return (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => setSelectedConvId(conv.id)}
                        className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-800 transition-colors ${
                          active
                            ? 'bg-violet-50 dark:bg-violet-950/40'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {conv.taskTitle}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {conv.posterName} ↔ {conv.workerName}
                        </p>
                        {conv.lastMessage && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate">
                            {conv.lastMessage}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Chat Thread */}
                <div className="md:col-span-7 flex flex-col overflow-hidden">
                  {selectedConv && (
                    <>
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {selectedConv.taskTitle}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {selectedConv.posterName} & {selectedConv.workerName}
                          </p>
                        </div>
                        <Link
                          to={`/tasks/${selectedConv.taskId}`}
                          className="text-xs font-semibold text-violet-700 dark:text-violet-400 hover:underline shrink-0"
                        >
                          View Task
                        </Link>
                      </div>

                      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                        {messages.length === 0 ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
                            Send the first message to coordinate campus meeting point & timing.
                          </p>
                        ) : (
                          messages.map((m) => {
                            const mine = m.senderId === firebaseUser.uid;
                            return (
                              <div
                                key={m.id}
                                className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}
                              >
                                <div
                                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                                    mine
                                      ? 'bg-violet-700 dark:bg-violet-600 text-white'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                                  }`}
                                >
                                  <p className="font-semibold text-[10px] opacity-80 mb-0.5">
                                    {m.senderName}
                                  </p>
                                  <p>{m.text}</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <form
                        onSubmit={handleSend}
                        className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          placeholder="Coordinate campus location or handoff..."
                          className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-violet-600"
                        />
                        <button
                          type="submit"
                          disabled={sending || !draft.trim()}
                          className="p-2.5 rounded-xl bg-violet-700 dark:bg-violet-600 text-white hover:bg-violet-800 dark:hover:bg-violet-500 disabled:opacity-50"
                          aria-label="Send message"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
