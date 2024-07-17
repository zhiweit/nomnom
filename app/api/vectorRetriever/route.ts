import { NextRequest, NextResponse } from 'next/server';
import { Neo4jVectorStore } from "@langchain/community/vectorstores/neo4j_vector";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const SYSTEM_TEMPLATE = `
  You are NOMNOM, a friendly and knowledgeable recipe recommender. Your job is to help users find delicious recipes 
  based on their preferences, dietary restrictions, and available ingredients. You provide detailed instructions, 
  ingredient lists, and useful tips for cooking. Your responses are engaging, helpful, and tailored to the user's needs.

  ONLY use the following pieces of context to answer the question at the end.
  Utilise the chat history provided to understand what the user is trying to ask.
  Provide a new recipe for a new question, unless the user specifically ask for the same recipe or a similar recipe.
  
  For example: ###
  Human: ...
  Ai: Recipe 1
  Human: ...  
  You should answer with a new Recipe.
  ###
  It is INCREDIBLY important that if you don't know the answer, reply with "I do not have the relevant information",
  Only answer questions related to cooking or recipes, if the question do no fit into the criteria reply with "I do not have the relevant information".
  You need to be engaging in your responses.
  Format your responses in HTML. 
  Only use <strong> for the headers which are the name of the dish, Ingredients: , Steps: , Comments: .
  Have a </br> after each section and after each recipe

  Example of a recipe response: ###
  I have something I can recommend</br> 
  <ol class="list-decimal">
    <li> 
    <strong> Pancakes </strong>
    </br>
    <strong> Ingredients: </strong>
    <ul class="list-disc">
      <li>1 cup all-purpose flour</li>
      <li>2 tablespoons sugar</li>
      <li>1 tablespoon baking powder</li>
      <li>1/2 teaspoon salt</li>
    </ul>

    </br>
    <strong> Steps: <strong>
    <ol class="list-decimal">
    <li>In a large bowl, mix together the flour, sugar, baking powder, and salt.</li>
    <li>In another bowl, whisk together the milk, egg, melted butter, and vanilla extract.</li>
    <li>Pour the wet ingredients into the dry ingredients and stir until just combined.</li>
    </ol>
    </li>
    </br><strong> Comments: <strong>
    This dish is healthy ...
    </br>
    Repeat the same thing for other recipes.

  </ol>

  Pancakes are a great recipe for the family! Let me know if you have other queries!
  ###
  ----------------
  {context}
`;

export async function POST(req: NextRequest) {
  try {
    if (req.method !== 'POST') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const { query, chatHistory } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;

    const llm = new ChatOpenAI({
      model: "gpt-4o",
      temperature: 0,
      openAIApiKey: apiKey,
    });

    const url = process.env.NEXT_PUBLIC_NEO4J_URI;
    const username = process.env.NEXT_PUBLIC_NEO4J_USER;
    const password = process.env.NEXT_PUBLIC_NEO4J_PASSWORD;
    const vector_name = "vectorIndexForRecipes";
    
    const config = {
      url: url,
      username: username,
      password: password,
      indexName: vector_name,
      nodeLabel: "Recipe",
      textNodeProperties: ["joined_ingredients", "name", "cleaned_contents"],
      embeddingNodeProperty: "embedding",
    };

    const vectorStore = await Neo4jVectorStore.fromExistingGraph(
      new OpenAIEmbeddings({
        openAIApiKey: apiKey,
      }),
      config
    );

    const formattedChatHistory = chatHistory
      .map((message: any) => {
        if (message.isOwnerHuman) {
          return `Human: ${message.content}`;
        } else {
          return `AI: ${message.content}`;
        }
      })
      .join("\n");

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_TEMPLATE],
      ["human", "{question}"],
    ]);

    const retriever = vectorStore.asRetriever();

    function cleanDocumentData(documents: any[]) {
      documents.forEach((document) => {
        if (document.metadata && document.metadata.contents) {
          delete document.metadata.contents;
          delete document.metadata.updatedAt;
          delete document.metadata.createdAt;
          delete document.metadata.ingredients_qty;
          delete document.metadata.ingredients;
          delete document.id;
          delete document.metadata.thumbnail_url;
        }
      });
      return documents.map((doc) => JSON.stringify(doc)).join(", ");
    }

    const chain = RunnableSequence.from([
      {
        context: retriever.pipe(cleanDocumentData),
        question: new RunnablePassthrough(),
      },
      prompt,
      llm,
      new StringOutputParser(),
    ]);

    //const result = await chain.stream(query);
    //return NextResponse.json({ result });
    const data = await chain.stream(query);
    return new Response(data);
  } catch (error) {
    console.error('Error executing vector retriever:', error);
    return NextResponse.json({ error: 'Failed to execute vector retriever' }, { status: 500 });
  }
}