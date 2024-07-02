import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
  } from "@remix-run/node";
  import { json, redirect } from "@remix-run/node";
  import { Form, Link, useLoaderData, useNavigate, useFetcher} from "@remix-run/react";

  import invariant from "tiny-invariant";
  
  import { getPage, getPageChildren, updatePage } from "../data";
  
  export const loader = async ({
    params,
  }: LoaderFunctionArgs) => {
    invariant(params.storyId, "Missing storyId param");
    invariant(params.pageId, "Missing pageId param");
    const page = await getPage(params.storyId, params.pageId);
    const children = await getPageChildren(params.storyId, params.pageId);
    if (!page) {
      throw new Response("Not Found", { status: 404 });
    }
    return json({ page, children });
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
    const { page, children } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const fetcher = useFetcher()

    return (
      <div>
        <fetcher.Form key={page.id} id="page-form" method="post"
          onChange={(event) => fetcher.submit(event.currentTarget)}
        >
          <p>
            <span>Prompt</span>
            <input
              defaultValue={page.prompt}
              aria-label="Prompt"
              name="prompt"
              type="text"
              placeholder="Prompt"
            />
          </p>
          <button onClick={()=>generate()}>Generate</button>
          <label>
            <span>Text</span>
            <textarea
              defaultValue={page.text}
              name="text"
              placeholder="text"
              type="text"
            />
          </label>      
          
          {/*<p>
            <button type="submit">
            {fetcher.state === "submitting"
              ? "Saving…"
              : "Save"}
          </button>
          </p>*/}
          
        </fetcher.Form>
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
        <nav>
        {children.length ? (
            <ul>
              {children.map((page) => (
                <li key={page.id}>
                  <Link
                    to={`../page/${page.id}`}
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
          <Form id="page-form-new-prompt" method="post" action="new">
          <p>
            <input
              defaultValue=""
              aria-label="Prompt"
              name="prompt"
              type="text"
              placeholder="Prompt"
            />
          </p>
          <p>
            <button type="submit">Create</button>
          </p>
          <p>
            <button type="button" onClick={()=>navigate("../page/"+page.parentId)}>Back</button>
          </p>
        </Form>

      </div>      
    );
  }
  

  function generate() {
    
  }