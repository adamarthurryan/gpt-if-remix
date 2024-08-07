import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { 
  Form,
  Link,
  Outlet,
  NavLink,
  useLoaderData,
  useNavigation,
  useSubmit,
  useFetcher
} from "@remix-run/react";
import invariant from "tiny-invariant";

import { getChapters, getStory, updateStory } from "../data";
import ChaptersNav from "../components/ChaptersNav";
import StoriesNav from "~/components/StoriesNav";

export const loader = async ({
  params,
}: LoaderFunctionArgs) => {
  invariant(params.storyId, "Missing storyId param");
  const story = await getStory(params.storyId);
  const chapters = await getChapters(params.storyId);
  if (story === null) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ story, chapters });
};

export const action = async ({
  params,
  request,
}: ActionFunctionArgs) => {
  invariant(params.storyId, "Missing storyId param");
  const formData = await request.formData();
  const updates = Object.fromEntries(formData);
  await updateStory(params.storyId, updates);
  return null; //redirect(`/contacts/${params.contactId}`);
};

export default function EditStory() {
  const { story, chapters } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const fetcher = useFetcher()
 

  return (
    <div className="flex w-full sm:w-2/3 md:w-3/4 pt-1 px-2">
      <main role="main" className="w-full sm:w-2/3 md:w-3/4 pt-1 px-2">

        <fetcher.Form key={story.id} id="story-form" method="post"
        onChange={(event) => fetcher.submit(event.currentTarget)}
        >
          <p>
            <span>Title</span>
            <input
              defaultValue={story.title}
              aria-label="Title"
              name="title"
              type="text"
              placeholder="Title"
            />
          </p>
          <label>
            <span>System Prompt</span>
            <textarea
              name="systemPrompt"
              placeholder="text"
              type="text"
              defaultValue = {story?.systemPrompt}
            ></textarea>
          </label>      
          
          <p>
            <button type="submit">
            {fetcher.state === "submitting"
              ? "Saving…"
              : "Save"}
          </button>
          </p>
          
        </fetcher.Form>

        <Form id="story-form-delete" method="post" action="delete"
          onSubmit={(event) => {
            if (!confirm("Delete this story?"))
              event.preventDefault();
          }}
        
        >
          <p>
            <button type="submit">Delete</button>
          </p>
        </Form>


      </main>
      <aside className="w-full sm:w-1/3 md:w-1/4 px-2">
        <div className="sticky top-0 p-4 w-full">
          <ChaptersNav chapters={chapters} story={story} />
        </div>
      </aside>
    </div>
);
}

/*      
*/