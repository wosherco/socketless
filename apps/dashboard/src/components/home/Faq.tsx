"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@socketless/ui/accordion";

const questions = [
  {
    q: "Test?",
    ans: "Yes, this is a test",
  },
  {
    q: "Test?",
    ans: "Yes, this is a test",
  },
  {
    q: "Test?",
    ans: "Yes, this is a test",
  },
];

export default function Faq() {
  return (
    <Accordion type="multiple">
      {questions.map((q, i) => (
        <AccordionItem value={`item-${i}`}>
          <AccordionTrigger>{q.q}</AccordionTrigger>
          <AccordionContent>{q.ans}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
