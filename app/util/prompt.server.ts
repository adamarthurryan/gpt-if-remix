type Message = {role: string, content?: string};
import { AbstractPage } from "openai/core.mjs";
import type { StoryRecord, PageRecord, ChapterRecord } from "../data";

import { getPageAncestors, getChapterPages, getPage, getChapterForPage } from "../data";

const SYNOPSIS_SYSTEM_PROMPT = "You are a writing assistant, optimized for summarizing text. I will supply you with a fragment of a story and you will generate a summary of the key events and characters.";


// create a prompt to follow on from a given page
// concatenate the page and all its ancestors' text and add the given prompt
export async function createPromptAll(story: StoryRecord, page: PageRecord): Promise<Message[]> {
    const ancestors = await getPageAncestors(story.id, page.id);

    let  messages: Message[] = [{role:"system", content:story.systemPrompt}];


    for (const page of ancestors) {
        messages.push({role:"user", content:promptString(page.prompt)});
        messages.push({role: "assistant", content:page.text});
    }

    messages.push({role:"user", content:promptString(page.prompt)});

    return messages;
}

export async function createPromptChapter(story: StoryRecord, chapter: ChapterRecord, page: PageRecord): Promise<Message[]> {
    const ancestors = await getChapterPages(story.id, page.id);

    let  messages: Message[] = [{role:"system", content:story.systemPrompt}];
    
    if (chapter.synopsis)
        messages.push({role:"assistant", content:("Synopsis: "+chapter.synopsis)});
    
    for (const page of ancestors) {
        messages.push({role:"user", content:promptString(page.prompt)});
        messages.push({role: "assistant", content:page.text});
    }

    messages.push({role:"user", content:promptString(page.prompt)});
    return messages;
}

const promptString = (prompt) => "> "+(prompt||"");

export async function createPromptChapterSynopsis(story: StoryRecord, chapter: ChapterRecord) : Promise<Message[]> {
    if (chapter.pageId == story.rootPageId)
        throw new Error("Cannot create a synopsis for the root chapter");

    const page = await getPage(story.id, chapter.pageId);
    const parentChapter = await getChapterForPage(story.id, page.parentId);

    const pages = await getChapterPages(story.id, page.parentId);
    let  messages: Message[] = [{role:"system", content:SYNOPSIS_SYSTEM_PROMPT}];
    
    if (parentChapter.synopsis)
        messages.push({role:"assistant", content:("Synopsis: "+parentChapter.synopsis)});


    for (const page of pages) {
        messages.push({role: "user", content:page.text});
    }
    messages.push({role:"user", content:page.text});

    return messages;
}