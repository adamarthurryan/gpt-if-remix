import type {
    ActionFunctionArgs,
} from "@remix-run/node";

import { redirect, json } from "@remix-run/node";
import { getPages } from "../data";
import invariant from "tiny-invariant";
  
//get pages in loader
export const loader = async ({
    params,
  }: LoaderFunctionArgs) => {
    invariant(params.storyId, "Missing storyId param");
    const pages = await getPages(params.storyId);
    return json({ pages });
  };

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
