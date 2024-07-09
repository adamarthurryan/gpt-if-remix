import type {
    ActionFunctionArgs,
  } from "@remix-run/node";
  import { json, redirect } from "@remix-run/node";
  import invariant from "tiny-invariant";
  
  import { deleteChapter, getChapter, getStory } from "../data";

  export const action = async ({
    params,
    request,
  }: ActionFunctionArgs) => {
    invariant(params.storyId, "Missing storyId param");
    invariant(params.pageId, "Missing pageId param");
    let story = await getStory(params.storyId);
    let chapter = await getChapter(params.storyId, params.pageId);
    if (!chapter || !story) {
      throw new Response("Not Found", { status: 404 });
    }
    if (story.rootPageId === params.pageId) {
        throw new Response("Cannot delete the root chapter", { status: 400 });
    }
    deleteChapter(params.storyId, params.pageId);
    return redirect(`/story/${params.storyId}/page/${chapter.pageId}`); 
  };
