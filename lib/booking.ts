export const BOOKING_URLS = {
  interview:
    process.env.NEXT_PUBLIC_BOOKING_INTERVIEW ||
    process.env.BOOKING_INTERVIEW_URL ||
    "https://cal.com/synthrun/interview-schedule",
  enquiry:
    process.env.NEXT_PUBLIC_BOOKING_ENQUIRY ||
    process.env.BOOKING_ENQUIRY_URL ||
    "https://cal.com/synthrun/30min",
  followUp:
    process.env.NEXT_PUBLIC_BOOKING_FOLLOW_UP ||
    process.env.BOOKING_FOLLOW_UP_URL ||
    "https://cal.com/synthrun/follow-up",
} as const;
