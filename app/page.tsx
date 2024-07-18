"use client";
import { Checkbox, Input } from "@nextui-org/react";

import { useState, useEffect, useRef, useCallback } from "react";

import { RecipeCard } from "./_components/RecipeCard";
import LoadingSkeleton from "./_components/LoadingSkeleton";
import { SearchIcon } from "./_components/SearchIcon";
import IngredientDropdown, {
  IngredientOption,
} from "./_components/IngredientDropdown";
import useRecipes from "./_hooks/useRecipes";
import InfiniteScroll from "react-infinite-scroll-component";
import useSearchRecipes from "./_hooks/useSearchRecipes";
import { fetchAuthSession } from "aws-amplify/auth";
import { gql, useLazyQuery } from "@apollo/client";
import { filter } from "graphql-yoga";

const LIMIT = 9;

const GET_FOLLOWING_QUERY = gql`
  query MyQuery($userId: ID!) {
    users(where: { id: $userId }) {
      following {
        id
      }
    }
  }
`;

export default function Page() {
  const [userId, setUserId] = useState<string>("");

  const [mutatedFavourite, setMutatedFavourite] = useState<object[]>([]);

  const [peopleYouFollow, setPeopleYouFollow] = useState<Object[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filterByFollowed, setFilterByFollowed] = useState<Boolean>(false);
  const [filterByFavourited, setFilterByFavourited] = useState<Boolean>(false);
  const [searchTerm, setSearchTerm] = useState<SearchTerm>({
    recipeName: "",
    ingredients: [],
  });

  const [
    getPeopleYouFollow,
    {
      data: getFollowingData,
      loading: getFollowingLoading,
      error: getFollowingError,
    },
  ] = useLazyQuery(GET_FOLLOWING_QUERY);

  const {
    recipes: allRecipes,
    totalPages: allRecipesTotalPages,
    currentPage: allRecipesCurrentPage,
    setCurrentPage: setAllRecipesCurrentPage,
  } = useRecipes(LIMIT);

  const {
    recipes: searchRecipes,
    currentPage: searchRecipesCurrentPage,
    totalPages: searchRecipesTotalPages,
    setCurrentPage: setSearchRecipesCurrentPage,
    setSearchTerm: setSearchRecipesSearchTerm,
  } = useSearchRecipes(LIMIT);

  // const {
  //   recipes: FavouriteRecipes,
  //   totalPages: FavouriteRecipesTotalPages,
  //   currentPage: favouriteRecipesCurrentPage,
  //   setCurrentPage: setFavouriteRecipesCurrentPage,
  // } = useRecipesFilterFavourites(LIMIT);

  useEffect(() => {
    if (
      searchTerm.recipeName.trim() == "" &&
      searchTerm.ingredients.length == 0
    ) {
      // console.log("set all recipes");
      setRecipes(allRecipes);
    }
  }, [allRecipes]);

  useEffect(() => {
    // console.log("searchRecipes useEffect");
    if (
      searchTerm.recipeName.trim() != "" ||
      searchTerm.ingredients.length > 0
    ) {
      // console.log("set search recipes");
      setRecipes(searchRecipes);
    }
  }, [searchRecipes]);

  useEffect(() => {
    // console.log("searcTerm useEffect");
    if (
      searchTerm.recipeName.trim() == "" &&
      searchTerm.ingredients.length == 0
    ) {
      setRecipes(allRecipes);
      setSearchRecipesCurrentPage(1);
      return;
    }
    setSearchRecipesSearchTerm(searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    async function fetchAuth() {
      const session = await fetchAuthSession();
      const userId = session?.tokens?.accessToken.payload.sub;

      if (userId) {
        setUserId(userId);
        getPeopleYouFollow({ variables: { userId: userId } });
      }
    }

    fetchAuth();
  }, []);

  useEffect(() => {
    if (getFollowingError) {
      console.error("getFollowingDataError: ", getFollowingError);
    }

    if (getFollowingData) {
      setPeopleYouFollow(getFollowingData.users[0].following);
      console.log(JSON.stringify(getFollowingData.users[0].following));
    }
  }, [getFollowingError, getFollowingData]);

  // useEffect(() => {
  //   if (filterByFavourited && mutatedFavourite.length > 0) {
  //     setRecipes(FavouriteRecipes);
  //   }
  // }, [filterByFavourited, mutatedFavourite]);

  return (
    <>
      <div className="max-w-screen md:px-20 md:pt-5 flex flex-col gap-4">
        {/* Search recipe name input */}
        <Input
          label="Search"
          isClearable
          radius="lg"
          classNames={{
            label: "text-black/50 dark:text-white/90",
            input: [
              "bg-transparent",
              "text-black/90 dark:text-white/90",
              "placeholder:text-default-700/50 dark:placeholder:text-white/60",
            ],
            innerWrapper: "",
            inputWrapper: [],
          }}
          placeholder="Search for recipe name"
          startContent={
            <SearchIcon className="text-black/50 mb-0.5 dark:text-white/90 text-slate-400 pointer-events-none flex-shrink-0" />
          }
          onChange={(e) => {
            // if (e.target.value.trim() === "") return; // use search all recipes instead of search recipes by name
            setSearchTerm({ ...searchTerm, recipeName: e.target.value });
          }}
        />

        {/* Search recipe by ingredients */}
        <div className="pb-5">
          <IngredientDropdown
            className="z-20"
            isMulti
            isClearable
            placeholder="Search for ingredient(s)"
            onChange={(newValue, actionMeta) => {
              newValue = newValue as IngredientOption[];
              setSearchTerm({
                ...searchTerm,
                ingredients: newValue.map((item) => item.value),
              });
            }}
          />
        </div>
      </div>

      {/* Sortbar */}
      {userId !== "" ? (
        <div className="flex gap-4 pb-5 px-20">
          <span>Filter by</span>
          <Checkbox
            size="md"
            onValueChange={(value) => setFilterByFollowed(value)}
          >
            Followed Users
          </Checkbox>
          <Checkbox
            size="md"
            onValueChange={(value) => setFilterByFavourited(value)}
          >
            Favourited
          </Checkbox>
        </div>
      ) : (
        ""
      )}

      {recipes.length == 0 ? (
        <div className="grid gap-4 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 p-4">
          {...Array(LIMIT).map(() => <LoadingSkeleton />)}
        </div>
      ) : (
        <InfiniteScroll
          dataLength={recipes.length}
          next={() => {
            if (
              searchTerm.recipeName.trim() != "" ||
              searchTerm.ingredients.length > 0
            ) {
              // console.log("searching more recipes based on search term");
              setSearchRecipesCurrentPage(searchRecipesCurrentPage + 1);
            } else {
              // console.log("searching more recipes");
              setAllRecipesCurrentPage(allRecipesCurrentPage + 1);
            }
          }}
          hasMore={
            searchTerm.recipeName.trim() != "" ||
            searchTerm.ingredients.length > 0
              ? searchRecipesCurrentPage <= searchRecipesTotalPages
              : allRecipesCurrentPage < allRecipesTotalPages
          }
          loader={<LoadingSkeleton />}
          className="grid gap-4 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 p-4"
        >
          {filterByFollowed && filterByFavourited
            ? peopleYouFollow &&
              recipes
                .filter((recipe) => {
                  const followStatus = peopleYouFollow.some(
                    (person) => person.id === recipe.owner.id
                  );
                  if (!mutatedFavourite.some((obj) => obj.id === recipe.id)) {
                    let favouriteStatus = recipe.favouritedByUsers.some(
                      (user) => user.id === userId
                    );

                    return favouriteStatus && followStatus;
                  } else {
                    let favouriteStatus = mutatedFavourite.some(
                      (obj) => obj.id === recipe.id && obj.like === true
                    );
                    return favouriteStatus;
                  }
                })

                .map((recipe, index) => (
                  <RecipeCard
                    recipe={recipe}
                    key={`${recipe.id}-${index}`}
                    peopleYouFollow={peopleYouFollow}
                    setPeopleYouFollow={setPeopleYouFollow}
                    setMutatedFavourite={setMutatedFavourite}
                    mutatedFavourite={mutatedFavourite}
                    searchIngredients={searchTerm.ingredients}
                  />
                ))
            : filterByFollowed || filterByFavourited
            ? filterByFollowed && !filterByFavourited
              ? peopleYouFollow &&
                recipes
                  .filter((recipe) =>
                    peopleYouFollow.some(
                      (person) => person.id === recipe.owner.id
                    )
                  )
                  .map((recipe, index) => (
                    <RecipeCard
                      recipe={recipe}
                      key={`${recipe.id}-${index}`}
                      peopleYouFollow={peopleYouFollow}
                      setPeopleYouFollow={setPeopleYouFollow}
                      setMutatedFavourite={setMutatedFavourite}
                      mutatedFavourite={mutatedFavourite}
                      searchIngredients={searchTerm.ingredients}
                    />
                  ))
              : !filterByFollowed &&
                filterByFavourited &&
                recipes
                  .filter((recipe) => {
                    if (!mutatedFavourite.some((obj) => obj.id === recipe.id)) {
                      let favouriteStatus = recipe.favouritedByUsers.some(
                        (user) => user.id === userId
                      );

                      return favouriteStatus;
                    } else {
                      let favouriteStatus = mutatedFavourite.some(
                        (obj) => obj.id === recipe.id && obj.like === true
                      );
                      return favouriteStatus;
                    }
                  })

                  .map((recipe, index) => (
                    <RecipeCard
                      recipe={recipe}
                      key={`${recipe.id}-${index}`}
                      peopleYouFollow={peopleYouFollow}
                      setPeopleYouFollow={setPeopleYouFollow}
                      setMutatedFavourite={setMutatedFavourite}
                      mutatedFavourite={mutatedFavourite}
                      searchIngredients={searchTerm.ingredients}
                    />
                  ))
            : recipes.map((recipe, index) => (
                <RecipeCard
                  recipe={recipe}
                  key={`${recipe.id}-${index}`}
                  peopleYouFollow={peopleYouFollow}
                  setPeopleYouFollow={setPeopleYouFollow}
                  setMutatedFavourite={setMutatedFavourite}
                  mutatedFavourite={mutatedFavourite}
                  searchIngredients={searchTerm.ingredients}
                />
              ))}
        </InfiniteScroll>
      )}
    </>
  );
}
