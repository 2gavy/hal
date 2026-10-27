import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { displayAnswer } from '@/lib/display-answer.mjs';
import { normalizeAnswerMarkdown } from '@/lib/answer-markdown.mjs';

// Share table support between the streaming preview and completed answers.
export default function AnswerMarkdown({ children }: { children: string }) {
  return <div className="markdown">
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
      table: ({ children }) => <div className="answer-table-scroll" role="region" aria-label="Answer table, scroll horizontally for more columns" tabIndex={0}>
        <table>{children}</table>
      </div>,
    }}>{normalizeAnswerMarkdown(displayAnswer(children))}</ReactMarkdown>
  </div>;
}
