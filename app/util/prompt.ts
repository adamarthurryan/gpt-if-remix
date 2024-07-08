type Message = {role: string, content?: string};
import type { StoryRecord, PageRecord } from "../data";

import { getPageAncestors } from "../data";

// create a prompt to follow on from a given page
// concatenate the page and all its ancestors' text and add the given prompt
export default async function createPrompt(story: StoryRecord, page: PageRecord): Promise<Message[]> {
    const ancestors = await getPageAncestors(story.id, page.id);

    let  messages: Message[] = [{role:"system", content:story.systemPrompt}];
        
    for (const page of ancestors) {
        messages.push({role:"user", content:page.prompt});
        messages.push({role: "assistant", content:page.text});
    }

    messages.push({role:"user", content:page.prompt});
    return messages;
}