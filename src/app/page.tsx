// src/app/page.tsx
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
  link?: string | null;
  polls?: Poll[];
};

export default function HomePage() {
  const { user } = useUser();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [members, setMembers] = useState<{ nickname: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [showVotes, setShowVotes] = useState<Poll | null>(null);
  const [pulsePollId, setPulsePollId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // 🧱 Wall of Shame: people who changed to "not coming" today for today's event(s)
  const [wallOfShame, setWallOfShame] = useState<
    { nickname: string; eventTitle: string }[]
  >([]);

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

  // 🔥 Fetch Wall of Shame for today (ANY event type)
  const fetchWallOfShame = async () => {
    const todayIso = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // 1) Load ALL events happening today
    const { data: eventsToday, error: eventsError } = await supabase
      .from("events")
      .select("id, title, date")
      .eq("date", todayIso);

    if (eventsError || !eventsToday || eventsToday.length === 0) {
      setWallOfShame([]);
      return;
    }

    const eventIds = eventsToday.map((e: any) => e.id);

    // 2) Votes "not coming" updated today for today's events
    const startOfDay = `${todayIso}T00:00:00+00:00`;
    const endOfDay = `${todayIso}T23:59:59+00:00`;

    const { data: votesData, error: votesError } = await supabase
      .from("votes")
      .select("nickname, eventId, vote, updated_at")
      .in("eventId", eventIds)
      .eq("vote", "not coming")
      .gte("updated_at", startOfDay)
      .lte("updated_at", endOfDay);

    if (votesError || !votesData) {
      setWallOfShame([]);
      return;
    }

    const map = new Map<string, { nickname: string; eventTitle: string }>();

    votesData.forEach((v: any) => {
      const event = eventsToday.find((e: any) => e.id === v.eventId);
      const title = event?.title || "Event";
      map.set(v.nickname, { nickname: v.nickname, eventTitle: title });
    });

    setWallOfShame(Array.from(map.values()));
  };

  useEffect(() => {
    fetchData();
    fetchWallOfShame();

    const pollsChannel = supabase
      .channel("polls_and_announcements_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poll_votes" },
        (payload) => {
          const newVote = payload.new as PollVote;
          const oldVote = payload.old as PollVote;

          setAnnouncements((prev) => {
            const copy = JSON.parse(JSON.stringify(prev)) as Announcement[];
            for (const a of copy) {
              if (!a.polls) continue;
              for (const poll of a.polls) {
                if (poll.id === (newVote?.poll_id || oldVote?.poll_id)) {
                  poll.poll_votes = poll.poll_votes.filter(
                    (v) =>
                      v.user_id !== (newVote?.user_id || oldVote?.user_id)
                  );
                  if (payload.eventType !== "DELETE" && newVote) {
                    poll.poll_votes.push(newVote);
                  }
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

    // Live updates for Wall of Shame when votes change
    const votesChannel = supabase
      .channel("votes_wall_of_shame")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes" },
        () => fetchWallOfShame()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pollsChannel);
      supabase.removeChannel(votesChannel);
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
    } else {
      setToast("Vote saved ✅");
      setTimeout(() => setToast(null), 2000);
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

  // 🎨 Force light mode styles globally
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.body.classList.remove("dark");
    document.body.style.backgroundColor = "#f9fafb";
    document.body.style.color = "#111827";
  }, []);

  // 🧁 UI
  return (
    <main className="relative min-h-[70vh] px-4 bg-gray-50 text-gray-900 flex flex-col items-center justify-center text-center overflow-hidden">
      {/* 🎯 Wall of Shame – fixed bottom-right background note */}
      {wallOfShame.length > 0 && (
        <div
          className="pointer-events-none opacity-30 sm:opacity-40 select-none z-0"
          style={{
            position: "absolute",
            bottom: 32, // ~bottom-8
            right: 24,  // ~right-6
            transform: "rotate(-4deg)",
          }}
        >
          <div className="bg-yellow-100 border border-yellow-300 shadow-xl rounded-md px-3 py-2">
            <p className="text-[10px] font-black tracking-[0.2em] text-red-700 uppercase mb-1">
              Wall of Shame
            </p>
            <ul className="text-xs sm:text-sm font-semibold text-gray-800 space-y-1">
              {wallOfShame.map((entry) => (
                <li key={entry.nickname}>• {entry.nickname}</li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] text-gray-600 italic">
              Changed to &quot;Not coming&quot; today.
            </p>
          </div>
        </div>
      )}

      {/* Foreground content */}
      <div className="relative z-10 flex flex-col items-center space-y-6 w-full">
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

          <Link href="/pinyes-overview">
            <button className="bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-full shadow-md transition w-full sm:w-auto">
              View Pinyes
            </button>
          </Link>
        </div>

        {/* 📢 Announcements */}
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full border-l-4 border-[#2f2484]">
          <h1 className="text-2xl font-bold mb-3 text-[#2f2484]">
            📢 Announcements
          </h1>

          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : announcements.length > 0 ? (
            <ul className="space-y-6 text-left">
              {announcements.map((a) => (
                <li key={a.id} className="border-b border-gray-200 pb-4">
                  <h3 className="font-semibold text-[#2f2484]">{a.title}</h3>
                  <p className="text-gray-700 text-sm whitespace-pre-line">
                    {a.message}
                  </p>

                  {a.link && (
                    <a
                      href={a.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline mt-1 inline-block"
                    >
                      Open link
                    </a>
                  )}

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
                                    ? Math.round(
                                        (votesFor.length / totalVotes) * 100
                                      )
                                    : 0;

                                return (
                                  <li key={opt}>
                                    <button
                                      onClick={() => handleVote(poll.id, opt)}
                                      disabled={!!voting}
                                      className={`w-full flex justify_between items-center border rounded-lg px-3 py-2 text-sm transition ${
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
                      {votesFor
                        .map((v) => getDisplayName(v.user_id))
                        .join(", ")}
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

      {/* ✅ Toast notification */}
      {toast && (
        <div className="fixed bottom-6 bg-[#2f2484] text-yellow-300 px-4 py-2 rounded-full shadow-md animate-fadeInOut z-50">
          {toast}
        </div>
      )}
    </main>
  );
}
