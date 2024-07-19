import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react"
import { Form, useLoaderData, Outlet, useNavigate} from "@remix-run/react";
import { json, redirect } from "@remix-run/node";

import invariant from "tiny-invariant";
import { getChapterForPage, getStory, updateChapter } from "../data";

export const loader = async ({
    params
}: LoaderFunctionArgs) => {
    invariant(params.storyId, "Missing storyId param");
    invariant(params.pageId, "Missing pageId param");
  
    const chapter = await getChapterForPage(params.storyId, params.pageId);
    const story = await getStory(params.storyId);
    return json({chapter, story});
}

export const action = async ({
    params,
    request,
  }: ActionFunctionArgs) => {
    invariant(params.storyId, "Missing storyId param");
    invariant(params.pageId, "Missing pageId param");
    const chapter = await getChapterForPage(params.storyId, params.pageId);

    const formData = await request.formData();
    const updates = Object.fromEntries(formData);
    const newChapter = await updateChapter(params.storyId, chapter.pageId, updates);
    return redirect(`/story/${params.storyId}/page/${params.pageId}`);
  };

export default function EditPage() {
    const {chapter, story} = useLoaderData();
    const navigate = useNavigate();

    function back(event) {
        navigate(-1);
    }
    function stopPropigation(event) {
        event.stopPropagation();
    }
    return (
        <div onClick={back} className="bg-gray-500/50 fixed  p-20 left-0 top-0 z-[1055] h-full w-full overflow-y-auto overflow-x-hidden outline-none">
            <Form id="chapter-form" onClick={stopPropigation} action="." method="post">
                <p>
                <textarea 
                    defaultValue={chapter.synopsis}
                    aria-label="Synopsis"
                    name="synopsis"
                    type="text"
                    placeholder="Synopsis"
                />
                </p>
                <button type="submit">Save</button>
                <button type="button" onClick={back}>Cancel</button>
            </Form>
        </div>
    );
}