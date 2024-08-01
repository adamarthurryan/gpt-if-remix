import type { StoryRecord, PageRecord } from "../data";
import markdownit from "markdown-it";
import texmath from 'markdown-it-texmath';
import katex from 'katex';

const md = markdownit({html:true})
                  .use(texmath, { engine: katex,
                             delimiters: 'brackets' });


export default function StoryView({story, ancestors}) {
    return (
        <div >
            {
                ancestors.map((page) => {
                    return (
                        <div key={page.id}>
                            <p className="em">&gt; <a href={`../page/${page.id}`}>{page.prompt}</a></p>
                            {page.text ? <PageView text={page.text}/> : <p></p>}
                        </div>
                    );
                })
            }
        </div>
    );  
}

function PageView({text}) {
    let markdown = md.render(text);
    return (
        <div dangerouslySetInnerHTML={{__html:markdown}}/>
            
    );  
}

