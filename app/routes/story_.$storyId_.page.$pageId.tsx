import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData, useNavigate, useFetcher} from "@remix-run/react";

import { useRef } from "react";
import invariant from "tiny-invariant";

import { useEventSource } from "remix-utils/sse/react";

import { getPageAncestors, getPage, getPageChildren, updatePage, getStory, getChapters, getChapterForPage, getChapterPages } from "../data";
import StoryView from "~/components/StoryView";
import ChaptersNav from "../components/ChaptersNav";

export const loader = async ({
  params,
}: LoaderFunctionArgs) => {
  invariant(params.storyId, "Missing storyId param");
  invariant(params.pageId, "Missing pageId param");

  const chapters = await getChapters(params.storyId);
  const chapter = await getChapterForPage(params.storyId, params.pageId);
  const ancestors = await getChapterPages(params.storyId, params.pageId);
  const page = await getPage(params.storyId, params.pageId);
  const children = await getPageChildren(params.storyId, params.pageId);
  if (!page) {
    throw new Response("Not Found", { status: 404 });
  }

  const story = await getStory(params.storyId);
  return json({ ancestors, page, children, story, chapters, chapter });
};

export const action = async ({
  params,
  request,
}: ActionFunctionArgs) => {
  invariant(params.storyId, "Missing storyId param");
  invariant(params.pageId, "Missing pageId param");
  const formData = await request.formData();
  const updates = Object.fromEntries(formData);
  await updatePage(params.storyId, params.pageId, updates);
  return null; //redirect(`/contacts/${params.contactId}`);
};

export default function EditPage() {
  const { ancestors, page, children, story, chapter, chapters } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher()

  let textRef = useRef();


  //let content=page.text;
  
  let content = useEventSource(`../page/${page.id}/generate`, {event:"content" });
  content = content?.replaceAll("\\n", "\n");
  let contentLines = content?.split("\n");


  return (
    <div key={page.id} className="flex">

    <div id="sidebar">
      <ChaptersNav chapters={chapters} story={story} />
    </div>

    <div className="prose">
      <h1>{story.title}</h1>
      <h2>{chapter.title}</h2>
      <StoryView ancestors={ancestors} currentText={content} currentPrompt={page.prompt} story={story}/>

      <div className="pt-2"></div>
      <fetcher.Form key={`${page.id}-prompt-edit`} id="page-form" method="post"
        onChange={(event) => fetcher.submit(event.currentTarget)}
      >
        <p>
          <input
            defaultValue={page.prompt}
            aria-label="Prompt"
            name="prompt"
            type="text"
            placeholder="Prompt"
          />
        </p>
      </fetcher.Form>
      <Form  id="page-form-reset" method="post" action="reset">
        <button type="submit">Reset</button>
      </Form>
        {
          contentLines ? 
          contentLines.map((line, index) => (
            <p key={line.slice(0,15)}>
              {line}
            </p>
          ))
          : <p key="null"></p>
        }
{/*
        <label>
          <span>Text</span>
          <textarea
            ref = {textRef}
            name="text"
            placeholder="text"
            type="text"
            value = {content?content:""}
            readOnly
          ></textarea>
        </label>      
*/ }

{/*          <p>
          <button type="submit">
          {fetcher.state === "submitting"
            ? "Saving…"
            : "Save"}
        </button>
        </p>
*/}          
{/*
      <Form id="page-form-delete" method="post" action="delete"
        onSubmit={(event) => {
          if (!confirm("Delete this page?"))
            event.preventDefault();
        }}
      
      >
        <p>
          <button type="submit">Delete</button>
        </p>
      </Form>
*/}
      <nav>
        
      {children.length ? (
          <ul className="list-disc pl-6">
            {children.map((page) => (
              <li key={`${page.id}-prompts`}>
                <Link
                  to={`../${page.id}`}
                >
                  {page.prompt ? (
                    <>
                      {page.prompt}
                    </>
                  ) : (
                    <i>No Prompt</i>
                  )}{" "}
                  </Link>
              </li>
            ))}
          </ul>
        ) : null}
        </nav>
        <Form id="page-form-new-prompt" key={`${page.id}-new-prompt`} method="post" action="new" preventScrollReset>
          <p>
            <input
              defaultValue=""
              aria-label="Prompt"
              name="prompt"
              type="text"
              placeholder="Prompt"
            />
            <button type="submit">Create</button>
          </p>
        </Form>
          {(chapter.pageId != page.id)?
            <Form id="page-form-new-chapter" key={`${page.id}-new-chapter`} method="post" action="chapter" preventScrollReset>
              <p>
                <input
                  defaultValue=""
                  aria-label="Title"
                  name="title"
                  type="text"
                  placeholder="Title"
                />
                <button type="submit">Create Chapter</button>
              </p>
            </Form>
          : (page.parentId)? <Form id="page-form-delete-chapter" key={`${page.id}-delete-chapter`} method="post" action="chapter/delete" preventScrollReset>
            <p>
              <button type="submit">Delete Chapter</button>
            </p>
            </Form>
          : <span></span>

          }
          {(page.parentId)?
            <button type="button"><Link preventScrollReset to={`../${page.parentId}`}>Back</Link></button>
            : <span></span>
          }
      </div>

    </div>      
  );
}


