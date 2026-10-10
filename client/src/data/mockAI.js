export const mockMeetingSummary = {
  meetingId: "m3",
  title: "Product Standup",
  date: "2026-10-14",
  executiveSummary: "The team discussed the upcoming Q4 product launch. The primary blocker is the payment gateway integration, which is currently delayed by 2 days due to API rate limits from the provider. Marketing assets are 90% complete and ready for review. The team agreed to prioritize the payment issue over the weekend to ensure a Tuesday launch.",
  keyDecisions: [
    "Delay the soft launch by 48 hours to accommodate payment gateway fixes.",
    "Allocate 2 additional engineers to the backend team temporarily.",
    "Approve the final marketing copy for the landing page."
  ],
  actionItems: [
    { id: 1, task: "Resolve API rate limit issue with Stripe", assignee: "Admin User", status: "In Progress", due: "Oct 16" },
    { id: 2, task: "Review final marketing assets", assignee: "Sarah Smith", status: "Pending", due: "Oct 15" },
    { id: 3, task: "Update deployment schedule", assignee: "John Doe", status: "Done", due: "Oct 14" }
  ],
  riskPoints: [
    "If Stripe integration fails again, the launch will miss the marketing window.",
    "Backend team is working overtime, risk of burnout."
  ]
};

export const mockTranscript = [
  { id: 1, speaker: "Admin User", time: "09:30", text: "Alright everyone, let's get started. John, how are we looking on the engineering side?" },
  { id: 2, speaker: "John Doe", time: "09:31", text: "We're mostly good, but we hit a snag with the Stripe integration. We're getting rate limited on the test environment, which is delaying the final QA." },
  { id: 3, speaker: "Admin User", time: "09:32", text: "That's not great. How much of a delay are we talking about?" },
  { id: 4, speaker: "John Doe", time: "09:32", text: "Probably about 48 hours. I need to get on a call with their support team today." },
  { id: 5, speaker: "Admin User", time: "09:33", text: "Okay, I'll jump in and help you with that. We need to resolve the API rate limit issue with Stripe by October 16th at the latest. I'll take ownership of that task." },
  { id: 6, speaker: "Sarah Smith", time: "09:34", text: "Just a heads up, the marketing assets are 90% done. I just need someone to review the final copy." },
  { id: 7, speaker: "Admin User", time: "09:34", text: "Thanks Sarah. Can you review the final marketing assets by tomorrow?" },
  { id: 8, speaker: "Sarah Smith", time: "09:35", text: "Yes, I'll have that done by October 15th." },
  { id: 9, speaker: "John Doe", time: "09:35", text: "I'll update the deployment schedule to reflect the 48-hour delay." },
  { id: 10, speaker: "Admin User", time: "09:36", text: "Great. Let's prioritize the payment issue this weekend. If we fail here, we miss the marketing window entirely." }
];
