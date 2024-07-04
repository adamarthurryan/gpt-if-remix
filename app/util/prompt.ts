type Message = {role: string, content?: string};

import { getPage } from "../data";

// create a prompt to follow on from a given page
// concatenate the page and all its ancestors' text and add the given prompt
export default async function createPrompt(storyId:string, prompt:string, systemPrompt:string, pageId?: string): Promise<Message[]> {
    let pages=[];
    let nextPageId = null;
    nextPageId = pageId;
    while (nextPageId != null) {
        const page = await getPage(storyId, nextPageId);
        if (!page) 
            throw new Error("Page not found: "+nextPageId);
        pages.push(page);
        nextPageId = page?.parentId;
    }
    let  messages: Message[] = [{role:"system", content:systemPrompt}];
    for (const page of pages) {
        messages.push({role:"user", content:page.prompt});
        messages.push({role: "assistant", content:page.text});
    }

    messages.push({role:"user", content:prompt});
    return messages;
}