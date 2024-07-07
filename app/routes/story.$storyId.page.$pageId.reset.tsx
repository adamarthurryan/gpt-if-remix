import type {
    ActionFunctionArgs,
  } from "@remix-run/node";
  import { json, redirect } from "@remix-run/node";
  import invariant from "tiny-invariant";
  
  import { updatePage } from "../data";

  export const action = async ({
    params,
    request,
  }: ActionFunctionArgs) => {
    invariant(params.storyId, "Missing storyId param");
    invariant(params.pageId, "Missing pageId param");

    await updatePage(params.storyId, params.pageId, {text:null});
    return redirect(`/story/${params.storyId}/page/${params.pageId}`); 
  };
