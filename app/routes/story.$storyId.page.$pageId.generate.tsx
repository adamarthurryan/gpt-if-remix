import type Message from "../util/openai";
import { eventStream } from "remix-utils/sse/server";
import invariant from "tiny-invariant";

import {getPage, getStory, updatePage} from "../data";

import createPrompt from "../util/prompt";

import openaiRequest from "../util/openai";

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

	//just return the text if it is available
	//!!! is this necessary or can we just return the text?
	if (page.text) {
		return eventStream(request.signal, function setup(send) {
			send({ event: "content", data: page.text });
		});
	}

	//return nothing if there is no prompt
	if (!page.prompt) {
		return eventStream(request.signal, function setup(send) {
			send({ event: "content", data: "" });
		});
	}

	const messages = await createPrompt(params.storyId, page.prompt, story.systemPrompt, page.parentId);

	return eventStream(request.signal, function setup(send) {
		async function run() {
			let content = "";
			for await (const chunk of openaiRequest("gpt-4", messages, request.signal)) {
				console.log(chunk);
				content += chunk;
				send({ event: "content", data: content });
			}
			let mutation={text:content};
			updatePage(params.storyId, params.pageId, mutation);
		}

		run();
	});
}