type Message = {role: string, content?: string};
import type { StoryRecord, PageRecord, ChapterRecord } from "../data";

import { getPageAncestors, getChapterPages } from "../data";

// create a prompt to follow on from a given page
// concatenate the page and all its ancestors' text and add the given prompt
export async function createPromptAll(story: StoryRecord, page: PageRecord): Promise<Message[]> {
    const ancestors = await getPageAncestors(story.id, page.id);

    let  messages: Message[] = [{role:"system", content:story.systemPrompt}];
        
    for (const page of ancestors) {
        messages.push({role:"user", content:page.prompt || ""});
        messages.push({role: "assistant", content:page.text});
    }

    messages.push({role:"user", content:page.prompt || ""});

    return messages;
}

export async function createPromptChapter(story: StoryRecord, chapter: ChapterRecord, page: PageRecord): Promise<Message[]> {
    const ancestors = await getChapterPages(story.id, page.id);

    let  messages: Message[] = [{role:"system", content:story.systemPrompt}];
    
    if (chapter.synopsis)
        messages.push({role:"user", content:chapter.synopsis});
    
    for (const page of ancestors) {
        messages.push({role:"user", content:page.prompt||""});
        messages.push({role: "assistant", content:page.text});
    }

    messages.push({role:"user", content:page.prompt||""});
    return messages;
}