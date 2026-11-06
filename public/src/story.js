// Story data from the original 2D game (index.html), unchanged in text/choices.
// Added for 3D: `loc` (where the player must go) and `cast` (who stands there).
const S = (chapter, chapterName, scene, title, loc, cast, text, choices, ending) => ({ chapter, chapterName, scene, title, loc, cast, text, choices, ending: !!ending });
const C = (label, next, effects = {}, log = '', requires) => ({ label, next, effects, log, requires });
const L1 = 'The Letter', L2 = 'The Library of Unwritten Names', L3 = 'The Last Train', L4 = 'The Clock Without Hands', L5 = 'The Moon Remembers';
const back = [C('Return to the title screen', 'home')];

export const story = {
opening: S(1, L1, 1, 'A Letter in the Rain', 'home', [], `Rain turns the rooftops silver. From Ren's window, the old clock tower rises above the city like a dark finger pointing at the red moon.\n\nA folded letter lies on the windowsill. The handwriting is unmistakably Ren's, though the memory of writing it is gone.\n\n“WHEN THE MOON TURNS RED, DO NOT OPEN THE TOWER.”\n\nThree knocks sound at the door. Someone is waiting outside.`, [
  C('Open the door and speak honestly.', 'miraDoor', { trust: 1 }, 'Ren chose honesty with the visitor.'),
  C('Hide the letter before opening the door.', 'miraGuarded', {}, 'Ren kept the letter secret.'),
  C('Inspect the letter for hidden marks first.', 'letterInspect', { clue: 'Silver symbol' }, 'A silver symbol was found on the letter.')]),
miraDoor: S(1, L1, 2, 'The Stranger at the Door', 'street', ['mira'], `A young librarian stands beneath a dark umbrella. “I'm Mira. I knew someone would find that letter tonight.”\n\nShe studies Ren's face with a sadness that feels older than the rain.\n\n“I can help you understand it,” she says. “But I need to know if you're ready to hear something you may not like.”`, [
  C('Tell Mira everything about the letter.', 'libraryIntro', { trust: 1 }, 'Ren trusted Mira with the letter.'),
  C('Ask what she knows about the tower.', 'towerRumor', { clue: 'Tower warning' }, 'Ren asked about the tower.'),
  C('Offer to help a lost child calling nearby.', 'lostChild', { compassion: 1 }, 'Ren helped a lost child before continuing.')]),
miraGuarded: S(1, L1, 2, 'A Careful Conversation', 'street', ['mira'], `Mira introduces herself as a librarian, but her eyes keep drifting toward Ren's closed hand.\n\n“People are forgetting things,” she says. “Names, faces, entire years. The library keeps what the city loses.”\n\nShe doesn't ask what Ren is hiding. Somehow, that makes the silence heavier.`, [
  C('Show Mira the letter after all.', 'libraryIntro', { trust: 1 }, 'Ren decided to show Mira the letter.'),
  C('Ask her to prove the library exists.', 'libraryIntro', { clue: 'Library seal' }, 'Ren asked Mira for proof.'),
  C('Leave and search the street alone.', 'lostChild', {}, 'Ren began investigating alone.')]),
letterInspect: S(1, L1, 2, 'The Silver Mark', 'street', [], `The paper feels warm despite the cold rain. Under the final line, a symbol glimmers: a crescent crossed by a tiny clock hand.\n\nWhen Ren touches it, a memory flashes — a train platform, a voice saying “not everyone should remember.” Then it vanishes.\n\nThe knocks at the door come again.`, [
  C('Open the door and show Mira the symbol.', 'libraryIntro', { trust: 1 }, 'Mira saw the silver symbol.'),
  C('Keep the symbol secret and follow the streetlights.', 'lostChild', { clue: 'Silver symbol' }, 'Ren kept the symbol secret.')]),
lostChild: S(1, L1, 3, 'The Child Who Forgot Home', 'street', ['child', 'mira'], `At the corner, a child stands beneath a broken streetlamp. They know their own name but cannot remember where home is.\n\nRen kneels beside them. For a moment, the city feels less like a mystery and more like a place full of people who need help.\n\nMira arrives and guides the child toward a warm shop. “The library,” she tells Ren, “is where we should go next.”`, [
  C('Ask Mira to explain the missing memories.', 'libraryIntro', { trust: 1 }, 'Ren continued to the library with Mira.'),
  C('Promise to help the child find their family later.', 'libraryIntro', { compassion: 1 }, 'Ren promised to return for the child.')]),
towerRumor: S(1, L1, 3, "The Tower's Rule", 'street', ['mira'], `“The tower is older than the city,” Mira says. “The Clockmaker says it protects us. My records say it takes something in return.”\n\nA bell rings once, though the tower clock has no hands. Several people on the street stop walking, then continue as if nothing happened.\n\nMira lowers her voice. “The library has the records. Come with me.”`, [
  C('Go to the library with Mira.', 'libraryIntro', { trust: 1 }, 'Ren followed Mira to the library.'),
  C("Write down the bell's time and sound.", 'libraryIntro', { clue: 'Handless bell' }, 'Ren recorded the tower bell.')]),
libraryIntro: S(2, L2, 1, 'A Library Beneath the Rain', 'library', ['mira'], `The library hides beneath a glass-roofed arcade. Inside, thousands of books hover in slow circles, their titles fading and returning like reflections on water.\n\nMira leads Ren to a shelf marked with the silver crescent. Most of the books are blank. One bears Ren's name — and a date from ten years ago.\n\n“You were here before,” Mira whispers. “You asked us to hide something.”`, [
  C('Open the book bearing Ren’s name.', 'renBook', { clue: 'Ren’s archive' }, 'Ren opened their own archive.'),
  C('Ask Mira why she never told Ren.', 'miraTruth', { trust: 1 }, 'Ren confronted Mira about the past.'),
  C('Search for a symbol matching the letter.', 'symbolPuzzle', { clue: 'Archive symbol' }, 'Ren searched the archive for the symbol.')]),
renBook: S(2, L2, 2, "The Memory That Wouldn't Stay", 'library', ['mira'], `The book opens to a drawing of the tower and a small train. The writing beneath it changes as Ren reads.\n\n“I chose to forget the night the sky broke.”\n\nA second sentence appears: “If I remember everything, the city will remember too.”\n\nRen closes the book. The words remain behind their eyes.`, [
  C('Tell Mira what the book said.', 'miraTruth', { trust: 1, clue: 'Ren’s warning' }, 'Ren shared the book’s warning.'),
  C('Copy the changing sentence into the journal.', 'symbolPuzzle', { clue: 'Changing sentence' }, 'Ren copied the sentence.')]),
miraTruth: S(2, L2, 2, "Mira's Missing Page", 'library', ['mira'], `Mira admits she was a child when Ren first visited. “You came with someone who wanted the city to forget a terrible event. You said it was the only way to keep everyone safe.”\n\n“Who was with me?” Ren asks.\n\nMira looks toward a locked cabinet. “The records were taken to the last train. If you want the rest, we need to go there.”`, [
  C('Trust Mira and head for the station.', 'trainStation', { trust: 1 }, 'Ren trusted Mira’s account.'),
  C('Ask to inspect the locked cabinet first.', 'symbolPuzzle', { clue: 'Locked cabinet' }, 'Ren inspected the archive cabinet.')]),
symbolPuzzle: S(2, L2, 3, 'The Crescent Cipher', 'library', ['mira'], `Three brass discs sit on a desk: a crescent, a clock hand, and a star. A note says, “Time points to what the moon conceals.”\n\nRen turns the discs until the clock hand points toward the crescent. A hidden drawer opens, revealing a ticket stamped with tonight's date.\n\nThe last train is waiting at the abandoned station.`, [
  C('Take the ticket and leave for the station.', 'trainStation', { clue: 'Last train ticket' }, 'Ren solved the crescent cipher.'),
  C('Record the cipher before leaving.', 'trainStation', { clue: 'Crescent cipher' }, 'Ren recorded the cipher solution.')]),
trainStation: S(3, L3, 1, 'Platform Zero', 'station', ['conductor', 'passengerA', 'passengerB'], `The station has no sign and no tracks on any city map. A train waits beneath a canopy of dim blue lamps. Its windows show different weather: snow, summer sunlight, a night sky filled with unfamiliar stars.\n\nThree passengers sit inside. Each claims to remember the same night — and each tells a different story.\n\nThe conductor holds out a hand. “One question before we depart.”`, [
  C('Ask the conductor what the train carries.', 'passengers', { clue: 'Train carries memories' }, 'Ren questioned the conductor.'),
  C('Ask the passengers about the tower.', 'passengers', { trust: 1 }, 'Ren asked the passengers about the tower.'),
  C('Study the windows for clues.', 'windowMemory', { clue: 'Window visions' }, 'Ren studied the strange train windows.')]),
windowMemory: S(3, L3, 2, 'Windows into Yesterday', 'station', ['conductor', 'passengerA'], `One window shows a crowded festival beneath a bright moon. Another shows the same square empty and covered in ash. In the third, Ren stands beside a masked figure holding a clock with no hands.\n\nThe visions overlap. A name appears on the glass, then fades before Ren can read it.\n\nSomeone on the train is hiding a memory — perhaps to protect Ren, perhaps to protect themselves.`, [
  C('Ask the passengers what they are hiding.', 'passengers', { clue: 'Masked figure' }, 'Ren asked about the masked figure.'),
  C('Follow the name etched into the window.', 'passengers', { clue: 'Fading name' }, 'Ren recorded the fading name.')]),
passengers: S(3, L3, 3, 'Three Versions of One Night', 'station', ['passengerA', 'passengerB', 'mira'], `The first passenger remembers a celebration. The second remembers a warning siren. The third remembers Ren standing at the tower door and choosing to close it.\n\nTheir stories cannot all be true — unless each person remembers only a piece.\n\nMira finds a ticket hidden beneath a seat. On the back, someone has written: “The Clockmaker did not start the forgetting. He inherited it.”`, [
  C('Keep the ticket and ask the Clockmaker directly.', 'clockmaker', { clue: 'Inherited forgetting' }, 'Ren kept the ticket.'),
  C('Compare all three accounts in the journal.', 'clockmaker', { clue: 'Contradictory accounts' }, 'Ren compared the passengers’ accounts.')]),
clockmaker: S(4, L4, 1, 'The Keeper of the Tower', 'tower', ['clockmaker'], `At the tower gate, the Clockmaker waits with a lantern. His mask is made from the face of a clock, its hands removed.\n\n“I maintain the boundary,” he says. “The city asked to be protected from one memory. Every generation has renewed that choice.”\n\n“Who made the first choice?” Ren asks.\n\nThe Clockmaker unlocks the gate. “You did — or the person you were before you forgot.”`, [
  C('Enter the tower and demand the full truth.', 'towerHeart', { clue: 'First choice' }, 'Ren entered the tower.'),
  C('Ask the Clockmaker to show the original record.', 'originalRecord', { trust: 1, clue: 'Original record' }, 'Ren asked for the original record.'),
  C('Refuse to trust him and inspect the mechanism.', 'towerHeart', { clue: 'Clock mechanism' }, 'Ren inspected the tower mechanism.')]),
originalRecord: S(4, L4, 2, 'The Original Record', 'tower', ['clockmaker'], `The original record describes a disaster: during the crimson eclipse, a machine beneath the tower amplified a painful memory until the entire city experienced it at once.\n\nRen's younger self helped create the memory barrier. The Clockmaker maintained it, but the barrier has begun to fail.\n\nThe record ends with a question in Ren's handwriting: “Can we learn to remember without letting the past control us?”`, [
  C("Take the record to the tower's heart.", 'towerHeart', { clue: 'Barrier origin' }, 'Ren carried the original record.'),
  C('Ask Mira what she wants the city to remember.', 'towerHeart', { trust: 1 }, 'Ren asked Mira what truth matters most.')]),
towerHeart: S(4, L4, 3, 'The Heart of the Clock', 'tower', ['clockmaker', 'mira'], `At the centre of the tower, a glass sphere contains thousands of tiny lights. Each light is a memory held back from the city.\n\nThe machine is failing. If it breaks without guidance, memories may return all at once. If it remains untouched, the city will continue forgetting.\n\nMira stands beside Ren. “We can choose what happens next. But we must choose together.”`, [
  C('Study the mechanism and look for a third option.', 'finalDecision', { clue: 'A third way' }, 'Ren searched for an alternative.'),
  C('Ask Mira and the Clockmaker to explain the risks.', 'finalDecision', { trust: 1 }, 'Ren listened to both sides.'),
  C('Think of the people who have already forgotten.', 'finalDecision', { compassion: 1 }, 'Ren put the city’s people first.')]),
finalDecision: S(5, L5, 1, 'The Choice Beneath the Moon', 'tower', ['clockmaker', 'mira'], `The sphere dims. Beyond the tower windows, the red moon begins to pale.\n\nRen understands the three paths. Restore the memories and let the city face its history. Keep the barrier and preserve the peace people know. Or, if enough evidence has been gathered, rebuild the machine so memories return gradually, with the choice to face them.\n\nThe final decision belongs to Ren.`, [
  C('Restore every memory, whatever the consequences.', 'endingRestore', {}, 'Ren chose to restore the city’s memories.'),
  C('Keep the barrier and protect the present.', 'endingSilence', {}, 'Ren chose to preserve the barrier.'),
  C('Build a new path for memories to return safely.', 'endingNew', {}, 'Ren chose a new way forward.', { clues: 3, trust: 2 }),
  C('Choose the most compassionate path for the city.', 'endingCompassion', {}, 'Ren chose a compassionate future.', { compassion: 2 })]),
endingRestore: S(5, L5, 2, 'Ending: The Restored Sky', 'tower', ['mira'], `Ren opens the sphere. Light rushes across the city — not as a weapon, but as a sunrise that arrives from within.\n\nPeople remember the promises they broke, the friends they lost, and the reasons they once chose silence. Some weep. Some embrace. Some need time before they can speak.\n\nThe city does not become perfect. It becomes honest. Ren watches the red moon fade into silver and understands that remembering is not the same as being trapped in the past.`, back, true),
endingSilence: S(5, L5, 2, 'Ending: The Gentle Silence', 'tower', ['clockmaker'], `Ren closes the sphere. The machine settles into a quiet rhythm, and the red moon dims behind a veil of cloud.\n\nThe city wakes with its familiar gaps. Some people remain safe from memories they are not ready to face. Others continue searching for the names and feelings that slip away each night.\n\nRen keeps the original record and leaves the tower unlocked. Perhaps one day the city will choose to remember. For now, the silence is gentle — but it is still silence.`, back, true),
endingNew: S(5, L5, 2, 'Ending: A New Memory', 'tower', ['mira', 'clockmaker'], `Ren aligns the crescent, the clock hand, and the star. The mechanism changes its rhythm. Instead of forcing memories back or hiding them away, it offers each person a choice: open a memory when ready, or leave it closed for now.\n\nThe city fills with small lights, one at a time. Mira opens a book that has been blank for years. The Clockmaker removes his mask. Luma rises into the sky, becoming a new constellation.\n\nRen has not erased the past. Ren has given the city a way to meet it.`, back, true),
endingCompassion: S(5, L5, 2, 'Ending: The Light We Keep', 'tower', ['mira', 'child'], `Ren remembers the child at the streetlamp, the frightened passengers, and Mira's careful honesty. The machine is adjusted to release only the memories people choose to face, one small light at a time.\n\nNot every secret is solved. Not every wound closes. But the city begins to care for the people behind its forgotten names.\n\nMira places the letter in the archive, not as a warning, but as proof that even a lost memory can become the beginning of a kinder choice.`, back, true)
};

// who looks like what (Kenney Mini Characters)
export const CAST = {
  mira:       { file: 'characters/character-female-c.glb', name: 'Mira' },
  clockmaker: { file: 'characters/character-male-d.glb',   name: 'The Clockmaker' },
  child:      { file: 'characters/character-female-f.glb', name: 'Lost child', height: 1.2 },
  conductor:  { file: 'characters/character-male-e.glb',   name: 'Conductor' },
  passengerA: { file: 'characters/character-male-b.glb',   name: 'Passenger' },
  passengerB: { file: 'characters/character-female-e.glb', name: 'Passenger' }
};
export const PLAYER_FILE = 'characters/character-male-a.glb';
