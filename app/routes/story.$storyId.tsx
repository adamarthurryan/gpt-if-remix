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

import { getStory, updateStory } from "../data";

export const loader = async ({
  params,
}: LoaderFunctionArgs) => {
  invariant(params.storyId, "Missing storyId param");
  const story = await getStory(params.storyId);
  if (story === null) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ story });
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
  const { story } = useLoaderData<typeof loader>();
  const submit = useSubmit();

  const fetcher = useFetcher()


  //let content=page.text;
  

  

  return (
    <div className="flex">
    <div>
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

      </div>
      <div id="sidebar">

      <nav>
      <ul>
          <li>
            <Link to={"page/"+story?.rootPageId}>Start</Link>
          </li>
      </ul>
      </nav>
      </div>
  </div>
);
}
