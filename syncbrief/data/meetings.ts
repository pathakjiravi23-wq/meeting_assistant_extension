export type ActionItem = { task: string; owner: string; due?: string }

export type Meeting = {
    id: string
    title: string
    date: string
    durationMin: number
    summary: string
    decisions: string[]
    actionItems: ActionItem[]
    transcript: string[]
}

export const sampleMeetings: Meeting[] = [
    {
        id: "1",
        title: "27th March, 26",
        date: "27 Mar",
        durationMin: 14,
        summary: "The team reviewed sprint progress and agreed to ship the onboarding flow before the weekend.",
        decisions: ["Ship onboarding flow by Friday", "Defer analytics dashboard to next sprint"],
        actionItems: [{ task: "Write release notes", owner: "Ravi", due: "Fri" }],
        transcript: ["Ravi: Let's review the sprint.", "Bharat: The API is ready."],
    },
    {
        id: "2",
        title: "26th March, 26",
        date: "26 Mar",
        durationMin: 32,
        summary: "Discussion of API readiness and the integration timeline with the payments team.",
        decisions: ["Use the v2 payments API"],
        actionItems: [
            { task: "Update API docs", owner: "Bharat", due: "Mon" },
            { task: "Schedule integration test", owner: "Ankit" },
        ],
        transcript: ["Bharat: The API is ready.", "Ankit: Deploy by Friday."],
    },
    {
        id: "3",
        title: "25th March, 26",
        date: "25 Mar",
        durationMin: 8,
        summary: "Short standup on deployment blockers.",
        decisions: [],
        actionItems: [{ task: "Fix staging deploy", owner: "Ankit" }],
        transcript: ["Ankit: Deploy by Friday."],
    },
    {
        id: "4",
        title: "24th March, 26",
        date: "24 Mar",
        durationMin: 21,
        summary: "Planning the next steps for user onboarding and tutorial content.",
        decisions: ["Onboarding gets a 3-step tour"],
        actionItems: [{ task: "Draft tour copy", owner: "Ravi", due: "Wed" }],
        transcript: ["Ravi: Next steps for onboarding."],
    },
]