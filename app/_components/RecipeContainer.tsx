"use client";
import { useEffect } from "react";
import { RecipeCard } from "./RecipeCard";
import { fetchAuthSession } from "aws-amplify/auth";

export function RecipeContainer({
  recipeResult,
  onFavouriteRecipe,
  userId,
  onUnfavouriteRecipe,
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {/* {flex space-x-4} */}
      {recipeResult === "loading" ? "Loading recipes..." : ""}

      {typeof recipeResult === "object" &&
        (recipeResult.recipes.length === 0
          ? "No recipes found"
          : recipeResult.recipes.map((recipe) => (
              <RecipeCard
                recipeObj={recipe}
                key={recipe.name}
                onFavouriteRecipe={onFavouriteRecipe}
                userId={userId}
                onUnfavouriteRecipe={onUnfavouriteRecipe}
              />
            )))}
    </div>
  );
}
