import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData, useNavigate, useFetcher, Await, defer, Outlet} from "@remix-run/react";

import { useRef, useState, useEffect, Suspense } from "react";
import invariant from "tiny-invariant";

import { useEventSource } from "remix-utils/sse/react";

import { getPage, getPageChildren, updatePage, updateChapter, getStory, getChapters, getChapterForPage, getChapterPages } from "../data";
import { createPromptChapter, createPromptChapterSynopsis } from "~/util/prompt.server";
import StoryView from "~/components/StoryView";
import ChaptersNav from "../components/ChaptersNav";
import AlwaysScrollToBottom from "~/components/AlwaysScrollToBottom";
import { isLoading, createLoaderStream } from "~/util/loader.server";
import { openaiRequest, openaiRequestSync } from "~/util/openai.server";
import { useDebounceFetcher } from "remix-utils/use-debounce-fetcher";


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
/*
  let isPageLoading = false;
  if (!page.text) {
    isPageLoading = true;
    if (!isLoading(page.id)) {
      createLoaderStream(story, chapter, page);
    }
  }

  return json({ancestors, page, children, story, chapters, chapter, isPageLoading});
*/    
  let pageText = page.text;
  if (!page.text) {
    const messages = await createPromptChapter(story, chapter, page);
    pageText = openaiRequestSync("gpt-4o", messages);
    pageText.then(text => {
      const  mutation = {text};
      updatePage(story?.id, page.id, mutation);
    })
  }

  let chapterSynopsis = chapter.synopsis || "";
  if (!chapter.synopsis && chapter.pageId != story.rootPageId) {

    const messages = await createPromptChapterSynopsis(story, chapter);  
    chapterSynopsis = openaiRequestSync("gpt-4o", messages);
    chapterSynopsis.then(text => {
      const  mutation = {synopsis:text};
      updateChapter(story?.id, chapter.pageId, mutation);
    });
  }

  return defer({pageText, chapterSynopsis, ancestors, page, children, story, chapters, chapter, isPageLoading:true, isChapterLoading:true});

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

export default function ViewPage() {
  const { pageText, chapterSynopsis, ancestors, page, children, story, chapter, chapters, isPageLoading, isChapterLoading } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  //const fetcher = useFetcher()
	const fetcher = useDebounceFetcher<Type>();

  let textRef = useRef();

  function editPage() {
    navigate(`./edit`);
  }

  function editChapter() {
    navigate(`./chapter/edit`);
  }

  return (
    <div key={page.id} className="flex flex-row flex-wrap py-4">
      <aside className="w-full sm:w-1/3 md:w-1/4 px-2">
        <div className="sticky top-2">
          <h1><Link to="/">gpt if</Link></h1>
          <ChaptersNav chapters={chapters} story={story} />
        </div>
      </aside>

    <div>
      <Outlet/>
    </div>

    <main role="main" className="prose w-full sm:w-2/3 md:w-3/4 pt-1 px-2">
        <h1>{story.title}</h1>
        <h2>{chapter.title}</h2>
        <Suspense fallback={<p>{isChapterLoading ? "Loading..." : "Error"}</p>}>
          <Await resolve={chapterSynopsis}>
            {(resolved) => <div onClick={editChapter} ><Content content={resolved}/></div>}
          </Await>
        </Suspense>

        <StoryView ancestors={ancestors} story={story}/>
      
      <div className="pt-2"></div>
  {//     
   }
      <fetcher.Form key={`${page.id}-prompt-edit`} id="page-form" method="post"
        onChange={(event) => fetcher.submit(event.currentTarget,  { debounceTimeout: 1000 })}
      >
        <p>
          <input defaultValue={page.prompt}
            aria-label="Prompt"
            name="prompt"
            type="text"
            placeholder="Prompt"
          />
        </p>
        <input type="hidden" value="" name="text"/>
        <button type="submit">Reset</button>
      </fetcher.Form>

      <div className="prose w-full">
          <Suspense fallback={<p>{isPageLoading ? "Loading..." : "Error"}</p>}>
          <Await resolve={pageText}>
            {(resolved) => <div onClick={editPage}><Content content={resolved}/></div>}
          </Await>
          </Suspense>
{/*
          isPageLoading ?
            <StreamedPageContent page={page}/> :
            <Content content={page.text}/>
*/}

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

function StreamedPageContent({page}) {

  const [chunks, setChunks] = useState<string[]>([]);
  let chunk = useEventSource(`../page/${page.id}/stream`, {event:"content" });

  if (chunk) {
    chunk.replaceAll("\\n", "\n");
  }

  useEffect(() => {
    setChunks((oldChunks) => {
      if (chunk !== null) {
        return oldChunks.concat(chunk);
      }
      return oldChunks;
    });
  }, [chunk]);

  let text = chunks.join("");
  
  return (
    <div> 
      <p> Loading</p>
      <Content content={text}/> </div>
    
  );
}

function Content({content}) {

  if (typeof content != "string") {
    content ="";
  }

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