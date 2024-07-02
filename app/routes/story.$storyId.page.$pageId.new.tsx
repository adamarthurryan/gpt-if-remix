import type {
    ActionFunctionArgs,
  } from "@remix-run/node";
  import { json, redirect } from "@remix-run/node";
  import invariant from "tiny-invariant";
  
  import { getPage, createEmptyPage, createPage } from "../data";
    
  export const action = async ({
    params,
    request,
  }: ActionFunctionArgs) => {
    invariant(params.storyId, "Missing storyId param");
    invariant(params.pageId, "Missing pageId param");
    const formData = await request.formData();
    const updates = Object.fromEntries(formData);
    const newPage = await createPage(params.storyId, params.pageId, updates);
    return redirect(`/story/${params.storyId}/page/${newPage.id}`);
  };
