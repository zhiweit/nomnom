"use client";
import { useDisclosure } from "@nextui-org/react";
import {
  Card,
  CardHeader,
  CardBody,
  Image,
  CardFooter,
  Button,
  Avatar,
} from "@nextui-org/react";
import { HeartIcon } from "./HeartIcon";
import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import { gql } from "@apollo/client/core";
import { fetchAuthSession } from "aws-amplify/auth";
import RecipeModal from "./RecipeModal";
import { useAuth } from "../AuthProvider";
import RecipeInputModal from "./RecipeInputModal";
import useFavRecipes from "../_hooks/useFavRecipes";
import toast from "react-hot-toast";

type RecipeCardProps = {
  recipe: Recipe;
  searchIngredients: string[];
};

export function RecipeCard({ recipe, searchIngredients }: RecipeCardProps) {
  const { userId } = useAuth();

  const [missingIngredients, setMissingIngredients] = useState<string[]>([]);
  const [isFavourited, setIsFavourited] = useState<boolean>(
    recipe.favouritedByUsers.some((user) => user.id === userId)
  );

  const {
    favouriteRecipe,
    unfavouriteRecipe,
    favouriteRecipeError,
    favouriteRecipeData,
    unfavouriteRecipeError,
    unfavouriteRecipeData,
  } = useFavRecipes();

  async function handleFavouriteRecipe(recipeId: string) {
    const session = await fetchAuthSession();
    const userId = session?.tokens?.accessToken.payload.sub;

    await favouriteRecipe({
      variables: { recipeId: recipeId, userId: userId },
    });
  }

  async function handleUnfavouriteRecipe(recipeId: string) {
    const session = await fetchAuthSession();
    const userId = session?.tokens?.accessToken.payload.sub;

    await unfavouriteRecipe({
      variables: { recipeId: recipeId, userId: userId },
    });
  }

  const [openEditModal, setOpenEditModal] = useState(false);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const {
    isOpen: isEditModalOpen,
    onOpen: onOpenEditModal,
    onOpenChange: onOpenEditModalChange,
  } = useDisclosure();

  const handleOpenEditRecipeModal = (open: boolean) => {
    onOpenChange();
    onOpenEditModal();
  };

  useEffect(() => {
    if (!favouriteRecipeData) return;
    if (favouriteRecipeData?.updateRecipes.info.relationshipsCreated > 0) {
      setIsFavourited(true);
    }
  }, [favouriteRecipeData]);

  useEffect(() => {
    if (!unfavouriteRecipeData) return;
    if (unfavouriteRecipeData?.updateRecipes.info.relationshipsDeleted > 0) {
      setIsFavourited(false);
    }
  }, [unfavouriteRecipeData]);

  useEffect(() => {
    if (!favouriteRecipeError) return;
    toast.error("Oops! Error favouriting recipe.");
    console.error(favouriteRecipeError);
  }, [favouriteRecipeError]);

  useEffect(() => {
    if (!unfavouriteRecipeError) return;
    toast.error("Oops! Error unfavouriting recipe.");
    console.error(unfavouriteRecipeError);
  }, [unfavouriteRecipeError]);

  useEffect(() => {
    if (!searchIngredients) {
      setMissingIngredients([]);
      return;
    }

    const searchIngredientsSet = new Set(searchIngredients);
    const newMissingIngredients = Array.from(
      [...recipe.ingredients].filter(
        (ingredient) => !searchIngredientsSet.has(ingredient)
      )
    );
    setMissingIngredients(newMissingIngredients);
  }, [searchIngredients]);

  return (
    <>
      <div className="cursor-pointer" onClick={onOpen} key={recipe.id}>
        <Card className="relative group" shadow="sm">
          <CardHeader className="pb-0 pt-3 px-3 m-2 flex-col items-start">
            <div className="flex place-items-center justify-between w-full pr-2 pl-0">
              <div className="flex gap-3 place-items-center">
                <Avatar
                  isBordered
                  radius="full"
                  size="md"
                  showFallback
                  src=""
                />
                <h4 className="text-sm font-semibold leading-none text-default-600 overflow-ellipsis">
                  {recipe.owner.display_name}
                </h4>
              </div>
            </div>

            <div className="pt-4">
              <h4 className="font-bold text-md">{recipe.name}</h4>
            </div>
          </CardHeader>
          <CardBody className="p-3 justify-end position: static object-fit: cover">
            <Image
              isZoomed
              radius="lg"
              width="100%"
              alt="Card background"
              className="object-cover rounded-xl h-[200px] w-full"
              src={
                recipe.thumbnail_url
                  ? recipe.thumbnail_url
                  : "/image_placeholder.png"
              }
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </CardBody>
          <CardFooter className="pt-0 px-3 mb-0 justify-between">
            <div className="grid-flow-row pb-1 space-y-0.5">
              {searchIngredients.length ==
              0 ? null : missingIngredients.length === 0 ? (
                <p
                  className="text-sm text-green-500"
                  style={{ alignSelf: "flex-end" }}
                >
                  You have all ingredients 😊
                </p>
              ) : (
                <p
                  className="text-sm text-red-500"
                  style={{ alignSelf: "flex-end" }}
                >
                  You lack {missingIngredients.length} ingredients 😔
                </p>
              )}
              <p
                className="mt-2 text-sm text-gray-500"
                style={{ alignSelf: "flex-end" }}
              >
                🕛 {recipe.time_taken_mins} mins
              </p>

              <p
                className="mt-2 text-sm text-gray-500"
                style={{ alignSelf: "flex-end" }}
              >
                🍽️ {recipe.serving} servings
              </p>
            </div>

            {userId && (
              <Button
                isIconOnly
                className="bg-white"
                aria-label="Like"
                onPress={() => {
                  isFavourited
                    ? handleUnfavouriteRecipe(recipe.id)
                    : handleFavouriteRecipe(recipe.id);
                }}
              >
                <HeartIcon filled={isFavourited} />
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
      <RecipeModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        recipe={recipe}
        missingIngredients={missingIngredients}
        onOpenEditRecipeModal={handleOpenEditRecipeModal}
      />

      {/* Opened when owner wants to edit the recipe */}
      <RecipeInputModal
        isOpen={isEditModalOpen}
        onOpenChange={onOpenEditModalChange}
        recipe={recipe}
      />
    </>
  );
}
