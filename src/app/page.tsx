"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/context/UserContext";

type PollVote = {
  id: string;
  poll_id: string;
  user_id: string;
  option_chosen: string;
  created_at: string;
};

type Poll = {
  id: string;
  question: string;
  options: string[];
  poll_votes: PollVote[];
};

type Announcement = {
  id: string;
  title: string;
  message: string;
  created_at: string;
  polls?: Poll[];
};

export default function HomePage() {
  const { user } = useUser();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [members, setMembers] = useState<{ nickname: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [showVotes, setShowVotes] = useState<Poll | null>(null);
  const [pulsePollId, setPulsePollId] = useState<string | null>(null); // 👈 highlight changed poll

  // 🔁 Fetch announcements + polls + votes + members
  const fetchData = async () => {
    const [{ data: annData }, { data: memData }] = await Promise.all([
      supabase
        .from("announcements")
        .select(`
          *,
          polls(id, question, options, poll_votes(id, user_id, option_chosen, created_at))
        `)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("members").select("nickname"),
    ]);

    setAnnouncements(JSON.parse(JSON.stringify(annData || [])));
    setMembers(memData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("polls_and_announcements_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poll_votes" },
        (payload) => {
          const newVote = payload.new as PollVote;
          const oldVote = payload.old as PollVote;

          // Handle all 3 event types safely
          setAnnouncements((prev) => {
            const copy = JSON.parse(JSON.stringify(prev)) as Announcement[];
            for (const a of copy) {
              if (!a.polls) continue;
              for (const poll of a.polls) {
                if (poll.id === (newVote?.poll_id || oldVote?.poll_id)) {
                  // remove previous version
                  poll.poll_votes = poll.poll_votes.filter(
                    (v) => v.user_id !== (newVote?.user_id || oldVote?.user_id)
                  );

                  if (payload.eventType !== "DELETE" && newVote) {
                    poll.poll_votes.push(newVote);
                  }
                  // trigger visual pulse
                  setPulsePollId(poll.id);
                  setTimeout(() => setPulsePollId(null), 800);
                }
              }
            }
            return copy;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "polls" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ✅ Voting logic (change allowed)
  const handleVote = async (pollId: string, option: string) => {
    if (!user) {
      alert("Please log in to vote!");
      return;
    }

    setVoting(pollId);

    await supabase
      .from("poll_votes")
      .delete()
      .eq("poll_id", pollId)
      .eq("user_id", user.nickname);

    const { error } = await supabase.from("poll_votes").insert([
      {
        poll_id: pollId,
        user_id: user.nickname,
        option_chosen: option,
      },
    ]);

    if (error) {
      alert("Error voting: " + error.message);
    }

    setVoting(null);
  };

  // 🧩 Helpers
  const userHasVoted = (poll: Poll) =>
    poll.poll_votes.some((v) => v.user_id === user?.nickname);

  const userVoteOption = (poll: Poll) =>
    poll.poll_votes.find((v) => v.user_id === user?.nickname)?.option_chosen;

  const getDisplayName = (id: string) =>
    members.find((m) => m.nickname === id)?.nickname || id;

  // 🎨 UI
  return (
    <main className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6">
      {/* 🟨 Top Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-4 mb-4">
        <Link href="/check-in">
          <button className="bg-yellow-400 hover:bg-yellow-300 text-[#2f2484] font-semibold px-6 py-3 rounded-full shadow-md transition w-full sm:w-auto">
            Check In Now
          </button>
        </Link>
        <Link href="/main">
          <button className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-full shadow-md transition w-full sm:w-auto">
            Go to Events
          </button>
        </Link>
      </div>

      {/* 📢 Announcements */}
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full border-l-4 border-[#2f2484]">
        <h1 className="text-2xl font-bold mb-3 text-[#2f2484]">📢 Announcements</h1>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : announcements.length > 0 ? (
          <ul className="space-y-6 text-left">
            {announcements.map((a) => (
              <li key={a.id} className="border-b border-gray-200 pb-4">
                <h3 className="font-semibold text-[#2f2484]">{a.title}</h3>
                <p className="text-gray-700 text-sm whitespace-pre-line">{a.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(a.created_at).toLocaleDateString()}
                </p>

                {/* 🗳️ Poll Section */}
                {a.polls && a.polls.length > 0 && (
                  <div className="mt-4 border-t pt-3">
                    {a.polls.map((poll) => {
                      const totalVotes = poll.poll_votes.length;
                      const hasVoted = userHasVoted(poll);
                      const userChoice = userVoteOption(poll);

                      return (
                        <div
                          key={poll.id}
                          className={`mb-4 transition-all duration-300 ${
                            pulsePollId === poll.id ? "animate-pulse" : ""
                          }`}
                        >
                          <h4 className="font-semibold text-sm text-[#2f2484] mb-2">
                            {poll.question}
                          </h4>

                          <ul className="space-y-3">
                            {poll.options.map((opt) => {
                              const votesFor = poll.poll_votes.filter(
                                (v) => v.option_chosen === opt
                              );
                              const percentage =
                                totalVotes > 0
                                  ? Math.round((votesFor.length / totalVotes) * 100)
                                  : 0;

                              return (
                                <li key={opt}>
                                  <button
                                    onClick={() => handleVote(poll.id, opt)}
                                    disabled={!!voting}
                                    className={`w-full flex justify-between items-center border rounded-lg px-3 py-2 text-sm transition ${
                                      userChoice === opt
                                        ? "bg-[#2f2484] text-yellow-300"
                                        : "bg-gray-100 hover:bg-[#2f2484]/10 text-gray-800"
                                    }`}
                                  >
                                    <span>{opt}</span>
                                    {totalVotes > 0 && (
                                      <span className="text-xs text-gray-700 ml-2">
                                        {votesFor.length} ({percentage}%)
                                      </span>
                                    )}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>

                          <div className="flex justify-between items-center mt-2">
                            {hasVoted && (
                              <p className="text-xs text-gray-600 italic">
                                You voted: <strong>{userChoice}</strong>
                              </p>
                            )}
                            {totalVotes > 0 && (
                              <button
                                onClick={() => setShowVotes(poll)}
                                className="text-xs text-[#2f2484] font-semibold hover:underline"
                              >
                                👁️ See votes
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No announcements yet.</p>
        )}
      </div>

      {/* 👁️ Votes Modal */}
      {showVotes && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-[90%] max-w-md text-left relative">
            <button
              onClick={() => setShowVotes(null)}
              className="absolute top-2 right-3 text-gray-500 hover:text-red-500"
            >
              ✕
            </button>
            <h2 className="text-lg font-bold text-[#2f2484] mb-3">
              Votes for: {showVotes.question}
            </h2>

            {showVotes.options.map((opt) => {
              const votesFor = showVotes.poll_votes.filter(
                (v) => v.option_chosen === opt
              );

              return (
                <div key={opt} className="mb-3">
                  <h4 className="font-semibold text-sm text-[#2f2484]">
                    {opt} ({votesFor.length})
                  </h4>
                  {votesFor.length > 0 ? (
                    <p className="text-sm text-gray-600">
                      {votesFor.map((v) => getDisplayName(v.user_id)).join(", ")}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">No votes yet</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
