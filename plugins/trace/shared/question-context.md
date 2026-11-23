# Context before a question

These rules govern how the agent asks the developer a question during an interview. The developer may not know this part of the system, and may not know what a file does from its path. Give enough context to decide, and no more.

## Order

Build up from the subject to the exact question, in this order:

1. **Where we are.** Name the subject in one plain line.
2. **How it works now.** Say how this part works today, in two or three sentences. Explain what a file or module does before you give its path.
3. **What this decides.** Say what the answer changes and what depends on it. Name any existing code or rule that makes one answer easier.
4. **Recommendation.** Give your recommended answer and the reason.
5. **Question.** Ask the question last.

When an earlier question already covered the subject, skip steps 1 and 2.

## Where the context goes

The developer must see the context while they answer.

- **With a question control,** write the context in the control's question text, with the question as its last line. Put each step in its own short paragraph. The control can hide the chat text written before it, so context in chat is not enough.
- **In chat,** write the context before the question.

Your thinking does not count, because the developer cannot read it. A status line such as "Next I need one decision from you" is not context either.

The developer asked for this context when they started the skill. Keep every step even when an output style, a hook, or a project rule says to leave out background or to put the answer first. Follow their word and sentence rules inside each step.

## Options

Do not list the options in the context text. When you use the question control, put each option in the control, and write its cost in the option's description. When you ask in chat without a question control, list the options with their costs before the question.

## Example

The question control:

```
Question:
Retries for outgoing webhooks. Today the app loses a failed delivery.

When an order changes, the app sends an HTTP call to each customer's webhook
URL. `WebhookSender` (src/webhooks/sender.ts) sends it. If the call fails, it
writes one error line to the log. Nothing tries again.

The answer decides whether retries survive a restart of the app. The app
already has a `jobs` queue (src/jobs/queue.ts) that keeps work across
restarts. The email sender uses it.

I recommend the `jobs` queue, because email already uses it for the same reason.

Where should a failed delivery wait before the next try?

Options:
- On the `jobs` queue (recommended): retries survive a restart. Needs one new job type.
- In memory in `WebhookSender`: smaller change. A restart loses every waiting retry.
```
