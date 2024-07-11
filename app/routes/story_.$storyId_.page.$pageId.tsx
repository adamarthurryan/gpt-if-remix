import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData, useNavigate, useFetcher, Await, defer} from "@remix-run/react";

import { useRef, useState, Suspense } from "react";
import invariant from "tiny-invariant";

import { useEventSource } from "remix-utils/sse/react";
import {useSubscribe} from "@remix-sse/client";

import { getPageAncestors, getPage, getPageChildren, updatePage, getStory, getChapters, getChapterForPage, getChapterPages } from "../data";
import { createPromptChapter } from "~/util/prompt.server";
import StoryView from "~/components/StoryView";
import ChaptersNav from "../components/ChaptersNav";
import AlwaysScrollToBottom from "~/components/AlwaysScrollToBottom";
import { isLoading, createLoaderStream } from "~/util/loader.server";
import { openaiRequest, openaiRequestSync } from "~/util/openai.server";

export const loader = async ({
  params,
}: LoaderFunctionArgs) => {
  invariant(params.storyId, "Missing storyId param");
  invariant(params.pageId, "Missing pageId param");

  const story = await getStory(params.storyId);

  const chapters = await getChapters(params.storyId);
  const chapter = await getChapterForPage(params.storyId, params.pageId);
  const ancestors = await getChapterPages(params.storyId, params.pageId);
  const page = await getPage(params.storyId, params.pageId);
  const children = await getPageChildren(params.storyId, params.pageId);
  
  if (!page) {
    throw new Response("Not Found", { status: 404 });
  }

  let content = page.text;
  if (!page.text) {
    const messages = await createPromptChapter(story, chapter, page);
    content = await openaiRequestSync("gpt-4o", messages);
  }
    
  return defer({pageText:content, ancestors, page, children, story, chapters, chapter, isPageLoading:true});

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
  const { pageText, ancestors, page, children, story, chapter, chapters, isPageLoading } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const fetcher = useFetcher()

  let textRef = useRef();

  console.log(isPageLoading, page.text);

  return (
    <div key={page.id} className="flex flex-row flex-wrap py-4">
      <aside className="w-full sm:w-1/3 md:w-1/4 px-2">
        <div className="sticky top-2">
          <h1><Link to="/">gpt if</Link></h1>
          <ChaptersNav chapters={chapters} story={story} />
        </div>
      </aside>


    <main role="main" className="prose w-full sm:w-2/3 md:w-3/4 pt-1 px-2">
        <h1>{story.title}</h1>
        <h2>{chapter.title}</h2>
        <StoryView ancestors={ancestors} story={story}/>
      
      <div className="pt-2"></div>
  {//     onChange={(event) => fetcher.submit(event.currentTarget)}
   }
      <fetcher.Form key={`${page.id}-prompt-edit`} id="page-form" method="post"
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

      <div className="prose w-full">
        <Suspense fallback={<p>{isPageLoading ? "Loading..." : "Error"}</p>}>
          <Await resolve={pageText}>
            <Content content={pageText}/>
          </Await>
        </Suspense>
        {
/*
          isPageLoading ?
            <StreamedPageContent page={page}/> :
            <Content content={page.text}/>
*/
          }
        <AlwaysScrollToBottom/>

      </div>
    
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
    
    </main>
    </div>      
  );
}

/*
function StreamedPageContent({page}) {
  //let chunk = useEventSource(`../page/${page.id}/stream`, {event:"content" });
  //console.log(chunk);
  //chunk = chunk?.replaceAll("\\n", "\n");
//let chunks = [];
  let chunks = useSubscribe(new EventSource(`../page/${page.id}/stream`), {maxEventRetention:50, channel:'content'});
//  console.log(chunks);
  if (!chunks)
    return <p>ERROR</p>;
  
//  chunk = chunk || "";
//  chunks = [chunk];
  chunks = chunks.map(chunk => chunk.replaceAll("\\n", "\n"));
  let content = chunks.join("");
  console.log(chunks);
  return (
    <div> 
      <p> Loading</p>
      <Content content={content}/> </div>
    
  );
}
*/

function Content({content}) {

  if (typeof content != "string") {
    content ="";
  }
  console.log("225", content);
  const contentLines = content?.split("\n");;
  return (
    <div> {
          contentLines.map((line, index) => (
            <p key={index}>
              {line}
            </p>
          ))
        }

    </div>
  );
}