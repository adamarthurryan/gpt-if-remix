import type {
    ActionFunctionArgs,
  } from "@remix-run/node";
  import { json, redirect } from "@remix-run/node";
  import invariant from "tiny-invariant";
  
  import { deletePage, getPage } from "../data";

  export const action = async ({
    params,
    request,
  }: ActionFunctionArgs) => {
    invariant(params.storyId, "Missing storyId param");
    invariant(params.pageId, "Missing pageId param");
    let page = await getPage(params.storyId, params.pageId);
    if (!page) {
      throw new Response("Not Found", { status: 404 });
    }
    if (page.parentId === null) {
        throw new Response("Cannot delete the root page", { status: 400 });
    }
    deletePage(params.storyId, params.pageId);
    return redirect(`/story/${params.storyId}/page/${page.parentId}`); 
  };
