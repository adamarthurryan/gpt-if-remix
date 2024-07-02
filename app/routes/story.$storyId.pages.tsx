import type {
    ActionFunctionArgs,
} from "@remix-run/node";

import { redirect } from "@remix-run/node";
import { getStory, createEmptyPage } from "../data";
import invariant from "tiny-invariant";
  

export const action = async ({
    params,
  }: ActionFunctionArgs) => {
    invariant(params.storyId, "Missing storyId param");

    const story = await getStory(params.storyId);
    if (!story) {
      throw new Response("Not Found", { status: 404 });
    }

    const page = await createEmptyPage(params.storyId, story?.rootPageId);
    return redirect(`/story/${story.id}/page/${page.id}`);
  };