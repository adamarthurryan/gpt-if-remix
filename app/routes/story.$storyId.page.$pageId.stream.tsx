import type { openaiRequest as Message } from "../util/openai.server";
import { eventStream } from "remix-utils/sse/server";
import invariant from "tiny-invariant";

import {getChapterForPage, getPage, getStory, updatePage} from "../data";

import {createPromptAll} from "../util/prompt.server";

import { openaiRequest } from "../util/openai.server";
import { isLoading, getLoaderStream, createLoaderStream, getLoaderStreamTee } from "~/util/loader.server";

import stringToStream from "string-to-stream";

const sanitize = (text) => text.replaceAll("\n", "\\n");

export async function loader({ request, params }: LoaderFunctionArgs) {
	invariant(params.storyId, "Missing storyId param");
    invariant(params.pageId, "Missing pageId param");
	//get page and story
	let story = await getStory(params.storyId);
	let page = await getPage(params.storyId, params.pageId);
	if (!page) {
		throw new Response("Page Not Found", { status: 404 });
	}
	if (!story) {
		throw new Response("Story Not Found", { status: 404 });
	}


	console.log(isLoading(page.id), page.text);
	
	let stream = null;
	const signal = request.signal;

	if (isLoading(page.id)) {
		console.log("teeing stream");
		stream = getLoaderStreamTee(page.id);
	}
	else if (!page.text) {
		console.log("creating loader");
		const chapter = await getChapterForPage(params.storyId, params.pageId);
		await createLoaderStream(story, chapter, page);
		console.log("teeing stream");
		stream = getLoaderStreamTee(page.id);
	}
	else {
		console.log("empty stream");
		return eventStream(signal, function setup(send, close) {
			async function run() {
				setTimeout(close, 10);;
			}
		
			run();
	
			//return the cleanup function
			return () => {};
		});
	}

	return eventStream(signal, function setup(send, close) {
		async function run() {

			for await (let chunk of stream) {
				if (typeof chunk != "string")
					chunk = chunk.toString();

				if (chunk!=null) {
					console.log(chunk);
					send({ event: "content", data: sanitize(chunk) });
				}
			}

			close();
		}
	
		run();

		//return the cleanup function
		return () => {};
	});

}