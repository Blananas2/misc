//This script attempts to assign Periodic Table Symbols to Keep Talking and Nobody Explodes modules automatically.

const fs = require("fs");
//this modules.txt file is all modules as listed when the main page of the repo is sorted from oldest to newest
const mx = fs.readFileSync("modules.txt").toString().replaceAll("’", "'").replaceAll("×", "x"); //change these two symbols to easier to access characters
const modules = mx.split('\n');
let lower = [];
const pref = 4; //preferred length; in all my testing there's no need to bring this higher than 4.
let outputAbs = [];
let abort = false;

for (n = 0; n < modules.length; n++) { //take the names of every module on the repo, in release order
  lower.push(modules[n].toLowerCase());
}

for (m = 0; m < modules.length; m++) { //then for every module
  let moduleName = modules[m];

  let naiveAb = camel(firstLetters(moduleName)); //take the first letter of each word
  if (!outputAbs.includes(naiveAb) && modulesDoesNotInclude(naiveAb) && naiveAb.length <= pref) { //if that works, great!
    outputAbs.push(naiveAb);
    continue;
  }

  let name = moduleName.split(' '); //if not, split the name up into it's words
  let wordCount = name.length;
  let lengths = [];
  
  if (wordCount > pref) { //if it's over 4 words, remove the shortest word it until it is
    while (name.length > pref) {
      for (p = 0; p < wordCount; p++) {
        lengths.push(name[p].length);
      }
      let minLength = Math.min(...lengths);
      let minWord = lengths.indexOf(minLength);
      name.splice(minWord, 1);
      wordCount -= 1;
    }
    naiveAb = camel(firstLetters(name.join(" ")));
    if (!outputAbs.includes(naiveAb) && modulesDoesNotInclude(naiveAb) && naiveAb.length <= pref) { //if the reduction is fine, great!
      outputAbs.push(naiveAb);
      continue;
    }
  }

  lengths = [];
  for (w = 0; w < wordCount; w++) {
    lengths.push(name[w].length);
  }
  let newAb = "";
  for (y = 0; y < wordCount; y++) {
    let maxLength = Math.max(...lengths); //if not, find the word that's the longest
    let maxWord = lengths.indexOf(maxLength);

    for (i = 2; wordCount+(i-1) <= pref; i++) { //use next letters of the longest word to lengthen ab
      ab = "";
      for (z = 0; z < wordCount; z++) {
        ab += (z == maxWord) ? name[z].slice(0, i) : name[z][0];
      }
      if (ab != "") { 
        ab = camel(ab);
      }

      if (!outputAbs.includes(ab) && modulesDoesNotInclude(ab) && newAb == "") { //if something works, great!
        newAb = ab;
      }
    }
    if (newAb == "") { //if not, try the next longest word instead
      lengths[maxWord] = -1;
    }
  }
  if (newAb != "") {
    outputAbs.push(newAb);
    continue;
  }

  if (moduleName.length <= pref) { //if the mod name itself is small enough, great!
    outputAbs.push(camel(moduleName));
    continue;
  }

  lengths = [];
  for (w = 0; w < wordCount; w++) {
    lengths.push(name[w].length);
  }
  if (wordCount == pref) { //if it's over 4 words, remove the shortest word
    for (p = 0; p < wordCount; p++) {
      lengths.push(name[p].length);
    }
    let minLength = Math.min(...lengths);
    let minWord = lengths.indexOf(minLength);
    name.splice(minWord, 1);
    lengths.splice(minWord, 1);
    wordCount -= 1;
  }
  let maxLength = Math.max(...lengths); //find the word that's the longest
  let maxIx = lengths.indexOf(maxLength);
  let maxWord = name[maxIx];
  let number = 1;
  while (newAb == "") {
    number += 1;
    newWord = "";
    let binaryNumber = "1"+rev(number.toString(2)); //and use a binary number to decide which letters to yoink from it; thanks to jan Misali for inspiration
    for (b = 0; b < binaryNumber.length; b++) {
      if (binaryNumber[b] == "1") {
        newWord += maxWord[b];
      }
    }
    let newerAb = "";
    for (q = 0; q < wordCount; q++) {
      newerAb += (q == maxIx) ? newWord : name[q][0];
    }
    newerAb = camel(newerAb);
    if (!outputAbs.includes(newerAb) && modulesDoesNotInclude(newerAb) && newerAb.length == pref) { //if something works, great! note we REQUIRE length 4
      newAb = newerAb;
    }
    if (number > 1023) { //provided we don't need to abort (because it couldn't find anything)
      abort = true;
      console.log("ABORTED AT: " + name);
      break;
    }
  }
  outputAbs.push(newAb); //should definitely work, hopefully
}

function firstLetters (n) { //this function takes the first letters of each word in a string
  let name = n.split(' ');
  let ab = "";
  for (w = 0; w < name.length; w++) {
    ab += name[w][0];
  }
  return camel(ab);
}

function camel (s) { //this function takes a string and converts it to one where only the first letter is capitalized, like elements should be
  if (s.length == 1) { return s.toUpperCase(); }
  if (s == "") { console.log("PANIC. There is an empty string for a module!"); abort = true; return null; }
  return s[0].toUpperCase() + s.slice(1).toLowerCase();
}

function rev (s) { //this function reverses a string
  return s.split("").reverse().join("");
}

function modulesDoesNotInclude (m) { //this method checks to make sure an abbreviation isn't the same as a module's name ignoring case
  return !lower.includes(m.toLowerCase());
}

if (!abort) { //and finally write to a file if everything's above board
  for (d = 0; d < modules.length; d++) {
    outputAbs[d] = outputAbs[d].padEnd(pref) + ("\t" + modules[d]);
  }
  let output = outputAbs.join("\n");
  fs.writeFile('output.txt', output, err => {
    if (err) {
      console.error(err);
    }
    console.log("output.txt updated");
  });
}