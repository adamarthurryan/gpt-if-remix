import type { StoryRecord, PageRecord } from "../data";


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
    let lines = text.split("\n");
    return (
        <div>
            {
                lines.map((line, index) => <p key={index}>{line}</p>)
            }
        </div>
    );  
}

