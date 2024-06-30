"use client";
import { useState } from "react";
import Editor from "../_components/Editor";
import { MdFullscreen,MdFullscreenExit } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { AddIngredient } from "../_components/AddIngredient";

import {Card, CardHeader, CardBody, CardFooter, Image, Input, Button, ButtonGroup} from "@nextui-org/react";

export default function CreateRecipe(){
    const [recipeSize,setRecipeSize]=useState("")
    const [windowIcon,setWindowIcon]=useState(<MdFullscreen/>)
    const [imageSize, setImageSize]=useState("size-8/12 d-flex object-cover rounded-xl justify-content-center mx-auto")

    const setRecipeSizeHandler= () =>{
        if(recipeSize==""){
            setRecipeSize("size-full")
            setWindowIcon(<MdFullscreenExit/>)
            setImageSize("size-full d-flex object-cover rounded-xl justify-content-center mx-auto")
        }else{
            setRecipeSize("")
            setWindowIcon(<MdFullscreen/>)
            setImageSize("size-8/12 d-flex object-cover rounded-xl justify-content-center mx-auto")
        }
    }
    return (
        <div className="sm:container flex items-center justify-center">
            <Card className={recipeSize}>
                <div className="ml-auto">
                    <Button isIconOnly aria-label="Full screen" onClick={setRecipeSizeHandler}>
                        {windowIcon}
                    </Button>
                    <Button isIconOnly aria-label="Close Screen" color="danger">
                        <RxCross2/>
                    </Button>
                </div>

                
                    <CardHeader className="pb-0 pt-2 px-4 flex-col items-center justify-center">
                    <input type="file" className="my-3"/>
                    <Image
                        src="./images/eggFriedRice.jpg"
                        className={imageSize}
                        />
                        <Input type="Dish Name" className="my-1 max-w-lg" isRequired placeholder="Enter the dish name"/>
                        <Input type="Preparation Time" className="my-1 max-w-lg" isRequired placeholder="Enter the preparation time"/>
                    </CardHeader>


                

                <CardBody>
                    <div className="font-bold text-large">
                        Ingredients
                        <AddIngredient/>
                        </div>

                    <div>
                        <p className="font-bold text-large">Steps</p>
                        <Editor holder="EditorJS"></Editor>
                    </div>
                </CardBody>

                <CardFooter>
                    <div className="ml-auto">
                        <Button color="secondary" size="md" >
                        Publish
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
