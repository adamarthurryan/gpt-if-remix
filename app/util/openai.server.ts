import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
type Message = {role: string, content: string};


export async function openaiRequestSync(model: string, messages: Message[]) {
    let signal = new AbortController().signal;
    let stream = await openaiRequest(model, messages, signal);
    let chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return chunks.join("");
     
}

//request from the LLM and pipe the response to the callback function
//callback will be given content chunks
export async function* openaiRequest(model: string, messages: Message[], signal: AbortSignal) {
    const config = {
        model,
        stream: true,
        messages, 
        stop:"",
    };
    
    const completion = await openai.chat.completions.create(config);

    //!!! how to abort when the abort signal is triggered?
    for await (const chunk of completion) {
        const [choice] = chunk.choices;
        const { content } = choice.delta;
        if (choice.finish_reason === "length") {
            throw new Error("Token Limit Reached");
        } else if (content == undefined) {
            //do nothing?
            //is this some sort of error? or just a sign that the request is finished
        } else {
            yield content;
        }
    }

    return;
}


/*
export default async function* openaiRequest(model: string, messages: Message[], signal: AbortSignal) {

    let searchParams = new URLSearchParams();
    searchParams.set("model", model);
    for (const message of messages) 
        searchParams.append("messages", JSON.stringify(message));
    
    const queryString = searchParams.toString();

    const response = await fetch("/server?"+queryString, {signal});
    let content = "";
    const decoder = new TextDecoder();
    if (response.body === null) {
        throw new Error("Response body is null");
    }

    //need to assert response.body is non-null?
    for await (const chunk of response.body) {
        const decodedValue = decoder.decode(chunk);

        switch (decodedValue) {
            case "ERROR:rate_limit_exceeded":
                throw new Error("Rate Limit Exceeded");
            case "ERROR:internal_server_error":
                throw new Error("Internal Server Error");
            case "ERROR:token_limit_reached":
                throw new Error("Token Limit Reached");
            default:
                yield decodedValue;
                content+=decodedValue;
        }
    }
    
    return content;
}
*/