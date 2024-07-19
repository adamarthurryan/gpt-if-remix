import type { openaiRequest as Message } from "./openai.server";

import { eventStream } from "remix-utils/sse/server";

import invariant from "tiny-invariant";

import {ChapterRecord, PageRecord, StoryRecord, getPage, getStory, updatePage} from "../data";

import {createPromptChapter} from "./prompt.server";

import { openaiRequest } from "./openai.server";

type Loader = {
    content: string;
    generator: any;
};

const loaders = {} as Record<string, Loader>;
const sanitize = (text:string) => text.replaceAll("\n", "\\n");

export function isLoading(pageId:string) : boolean {
    return !!loaders[pageId];
}


export function getLoaderStreamTee(pageId:string) : EventStream {
    let stream = loaders[pageId]._stream;
	console.log(stream);
	let [streamA, streamB] = stream.tee();
	loaders[pageId]._stream = streamA;
	return streamB;
}

export async function createLoaderStream(story: StoryRecord, chapter: ChapterRecord, page: PageRecord) {

	const messages = await createPromptChapter(story, chapter, page);

    //create the loader object
    let loader = {content:""} as Loader;
    loader.content = "";
    loaders[page.id] = loader;


	const asyncGenerator = await openaiRequest("gpt-4o", messages);

	for await (const chunk of asyncGenerator) {
		if (chunk!=null) {
			loader.content += chunk;
		}

	}
	let mutation={text: loader.content};
	updatePage(story.id, page.id, mutation);

	delete loaders[page.id];
}