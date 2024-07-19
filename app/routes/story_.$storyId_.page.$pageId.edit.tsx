import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
} from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react"
import { Form, useLoaderData, json, Outlet, useNavigate} from "@remix-run/react";
import invariant from "tiny-invariant";
import { getPage, getStory } from "../data";

export const loader = async ({
    params
}: LoaderFunctionArgs) => {
    invariant(params.storyId, "Missing storyId param");
    invariant(params.pageId, "Missing pageId param");
  
    const page = await getPage(params.storyId, params.pageId);
    const story = await getStory(params.storyId);
    return json({page});
}

export default function EditPage() {
    const {page, story} = useLoaderData();
    const navigate = useNavigate();

    function back(event) {
        navigate(-1);
    }
    function stopPropigation(event) {
        event.stopPropagation();
    }
    return (
        <div onClick={back} className="bg-gray-500/50 fixed  p-20 left-0 top-0 z-[1055] h-full w-full overflow-y-auto overflow-x-hidden outline-none">
            <Form id="page-form" onClick={stopPropigation} action=".." method="post">
                <p>
                <textarea 
                    defaultValue={page.text}
                    aria-label="Text"
                    name="text"
                    type="text"
                    placeholder="Text"
                />
                </p>
                <button type="submit">Save</button>
                <button type="button" onClick={back}>Cancel</button>
            </Form>
        </div>
    );
}