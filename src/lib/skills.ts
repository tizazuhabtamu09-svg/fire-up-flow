/** Skills offered on employee registration. Users may also add custom ones. */
export const SKILLS = [
  { value: "cooking", label: "Cooking" },
  { value: "cleaning", label: "Cleaning" },
  { value: "laundry", label: "Laundry & Ironing" },
  { value: "childcare", label: "Childcare" },
  { value: "elderly_care", label: "Elderly Care" },
  { value: "driving", label: "Driving" },
  { value: "gardening", label: "Gardening" },
  { value: "security", label: "Security" },
  { value: "construction", label: "Construction" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical Work" },
  { value: "painting", label: "Painting" },
  { value: "tailoring", label: "Tailoring" },
  { value: "hairdressing", label: "Hairdressing" },
  { value: "computer", label: "Computer & Office" },
] as const;

export const skillLabel = (v: string) => SKILLS.find((s) => s.value === v)?.label ?? v;
