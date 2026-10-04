/**
 * Tales — one per scent, from the owner's Scents.pdf, edited for the house
 * voice. A tale is published once its text is complete and its wide still
 * (public/images/tale-<slug>) exists, so no page ever shows a placeholder.
 */
import { siteImage } from "@/lib/site-images";

export type Tale = {
  slug: string;
  title: string;
  handle: string; // the scent it belongs to
  line: "eterna" | "eterno" | "eternal";
  signature: string;
  heroArt: string;
  /** "1 min read", counted from the text itself (below), so it can never disagree with it. */
  readTime: string;
  paragraphs: string[];
  complete: boolean;
};

/** Reading time at about 230 words a minute, never under one. */
const readTimeOf = (paragraphs: string[]) => {
  const words = paragraphs.join(" ").split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 230))} min read`;
};

const drafts: Omit<Tale, "readTime">[] = [
  {
    slug: "shadow-of-the-sea",
    title: "The sea signs the ones it gives back.",
    handle: "shadow-of-the-sea",
    line: "eterno",
    signature: "You can smell the ones the sea decided to give back.",
    heroArt: "Campaign still, full bleed — fishing boat coming out of the fog, first light",
    complete: true,
    paragraphs: [
      "There’s an island the old charts leave blank. Not unmarked by accident — left off on purpose, the way you’d avoid writing down a name you didn’t want to say twice.",
      "Every so often, a boat didn’t come back on time. Fog took it, or the current did, or something neither one wanted credit for. When the men finally did return, sunburned and short on words, the village always knew before the boat reached the harbour. They knew by the smell carried in on the wind ahead of it.",
      "Bergamot first, the same as always, the same sea-bright citrus every boat came home with. Then something underneath it that didn’t belong to any boat. Smoke with no fire behind it. Resin, dark and warm, like a temple nobody remembered building. Patchouli deep in the collar, tonka bean in the skin, as if the island had pressed itself into them and hadn’t finished letting go.",
      "Wives said their husbands smelled different for months after. Not worse. Just marked. Like the sea had signed them.",
      "Nobody asked the men what happened on the island. They wouldn’t have answered. But every fisherman who returned from it stopped being afraid of open water again — as if whatever found him out there had already done its worst, and let him go anyway.",
      "Some men come back from the sea. A few come back changed by it. You can smell the difference from the shore.",
    ],
  },
  {
    slug: "wayne",
    title: "Nobody could quite place him.",
    handle: "wayne",
    line: "eterno",
    signature: "Don’t be the man she notices. Be the man she asks about.",
    heroArt: "Campaign still, wide — a candlelit dinner table, one empty chair, a man leaving through the doorway",
    complete: true,
    paragraphs: [
      "Most men want to be noticed. Wayne learned that being wondered about was far more powerful.",
      "At dinner, nobody could quite place him. He wasn’t the loudest at the table. He didn’t mention what he did. He never turned his wrist so you could see the watch. Yet when he stood to leave, someone asked: “Who is that?”",
      "Maybe it was the way he carried himself. Maybe it was the contradiction. Something sharp and unmistakably masculine at first — fresh, confident, commanding. Then, when he came closer, something richer underneath. Smoother. Darker. More refined. The kind of scent that makes someone lean in once and remember it hours later.",
      "Wayne understood what most men learn too late: people rarely remember what you told them about yourself. They remember how your presence made them feel.",
      "So don’t tell them you’re successful. Don’t tell them you’re different. Don’t ask to be noticed. Give them just enough to become curious. Then leave.",
    ],
  },
  {
    slug: "enzo-1898",
    title: "Lake Como, Sunday morning.",
    handle: "enzo-1898",
    line: "eterno",
    signature: "He looks like money was never the problem.",
    heroArt: "Campaign still, wide — a man in a white shirt tossing his car keys to the valet outside a lakeside hotel",
    complete: true,
    paragraphs: [
      "Sunday morning, Lake Como. The hotel entrance is quiet until an engine breaks the silence. Not loud. Just enough.",
      "A silver grand tourer stops outside. He steps out in yesterday’s white shirt and sunglasses, wearing the kind of watch nobody needs to ask about. The receptionist knows him. The valet knows the car. The woman having breakfast by the window knows neither. Yet.",
      "She watches him hand over the keys and walk inside. There’s something different about a man who isn’t trying to look expensive — maybe because the truly expensive things were never designed to shout. Italian cars understood that. So did Italian tailoring. And so did men from an era when elegance still carried a hint of danger.",
      "He passes her table. For a second, his fragrance stays behind. She turns. Too late: he’s already gone upstairs.",
      "She looks at the receptionist. “Who was that?” He smiles. “Enzo.” Nothing more.",
      "Some names don’t need an introduction. They need a reputation.",
    ],
  },
  {
    slug: "forbidden-apple",
    title: "The crab apple tree was still flowering.",
    handle: "forbidden-apple",
    line: "eterna",
    signature: "The memory you shouldn’t revisit is the one that still owns you.",
    heroArt: "Campaign still, wide — a crab apple tree in flower beside a whitewashed hotel entrance",
    complete: true,
    paragraphs: [
      "There are places you avoid because something terrible happened there. And places you avoid because something beautiful did.",
      "Years later, he returned to the coast. The hotel had changed its name. The terrace had been rebuilt. Even the road leading there seemed smaller than he remembered. But beside the entrance stood the same crab apple tree. Still flowering. That was enough.",
      "Suddenly he remembered everything he had spent years learning not to. The open windows. Salt in the evening air. Citrus on her hands. The shirt she left behind. The conversation they never finished.",
      "Strange how memory works. You can forget a face in detail, the exact sound of a voice, what was said on the last night. Then a scent appears, and time gives everything back.",
      "He stood beneath the blossoms for a moment, then walked inside. He knew better. But some memories grow more tempting precisely because you’ve forbidden yourself from returning to them.",
    ],
  },
  {
    slug: "mercury",
    title: "Cairo on Monday. Milan on Wednesday.",
    handle: "mercury",
    line: "eterno",
    signature: "Wherever you arrive, belong there.",
    heroArt: "Campaign still, wide — travellers crossing a departures hall at dusk",
    complete: true,
    paragraphs: [
      "Some men belong to one place. He never did.",
      "Cairo on Monday. A meeting in Milan on Wednesday. By Friday, nobody was quite sure where he was. His life ran between departures and arrivals — hotel keys, unfamiliar streets, conversations with people he’d met ten minutes earlier. And somehow, wherever he went, he belonged.",
      "That was his advantage. He could sit across from a CEO at noon and disappear into a crowded rooftop at midnight without changing who he was. Sharp when he needed to be. Relaxed when he wanted to be. Impossible to put into one category.",
      "People often mistook that ease for confidence. It wasn’t. Confidence can be learned. What he had was rarer: he could fit anywhere without becoming anyone else.",
      "Even his scent carried the contradiction. An immediate flash of grapefruit — bright, electric, impossible to ignore — settling into something warmer, darker and far more persistent. You noticed the freshness first. You remembered the man afterwards.",
      "The Romans gave Mercury wings because no world could contain him. We gave his name to a fragrance for the same kind of man.",
    ],
  },
  {
    slug: "sapphire",
    title: "There was something expensive about him.",
    handle: "sapphire",
    line: "eterno",
    signature: "They don’t remind people of a perfume. They remind people of you.",
    heroArt: "Campaign still, wide — a hotel bar at night, a man and a woman at the counter",
    complete: true,
    paragraphs: [
      "Nobody could explain exactly what. It wasn’t the watch. It wasn’t the jacket. It wasn’t even the car waiting outside.",
      "It was the details. The way he never checked the bill. The way he spoke without trying to impress anyone. The way women seemed to notice him twice — once when he entered, and again when he passed close enough to catch his scent.",
      "At the bar, she finally asked him what he was wearing. He looked at her. “Sapphire.” She smiled. “I meant the fragrance.” “So did I.”",
      "Later, she would forget what he ordered, and most of their conversation. But weeks later she passed someone wearing something vaguely similar, and thought of him at once.",
      "That’s the dangerous thing about certain fragrances.",
    ],
  },
  {
    slug: "tonic-club",
    title: "Monaco, 7.30 pm.",
    handle: "tonic-club",
    line: "eterno",
    signature: "Monaco has enough money. Wear something it remembers.",
    heroArt: "Campaign still, wide — dinner on a marina terrace at dusk, yachts behind",
    complete: true,
    paragraphs: [
      "His car disappears with the valet as he walks towards the marina. No tie. No logos. Nothing that needs explaining.",
      "A friend waves from a table overlooking the yachts. He joins them. Someone pours a drink. Someone mentions tomorrow’s plans. “Saint-Tropez?” He smiles. “Maybe.”",
      "At the next table, she notices his fragrance before she notices his watch. A few minutes later she leans towards her friend. “Do you know what he’s wearing?” She doesn’t. Neither does anyone else. And somehow, that makes it better.",
      "Because in a place where everyone can afford expensive, taste is what sets a man apart.",
    ],
  },
  {
    slug: "linen",
    title: "Tokyo, 8.55 am. Five candidates. One position.",
    handle: "linen",
    line: "eterno",
    signature: "First impressions don’t wait for your résumé.",
    heroArt: "Campaign still, wide — a quiet waiting room in a Tokyo office, morning light",
    complete: true,
    paragraphs: [
      "In the waiting room, everyone is rehearsing answers. He isn’t. Neat suit. Hair still wet from the shower. Linen.",
      "His name is called. Twenty-five minutes later, the interviewer closes his notebook. “We’ll be in touch.” He stands, thanks them, and leaves.",
      "The door closes. One interviewer looks at the others. “Strong candidate.” The woman beside him nods. Then smiles. “He looked like he already had the job.”",
      "Monday morning, he did.",
    ],
  },
];

/** Every tale, written or not. Only complete ones are published (see `tales`). */
export const allTales: Tale[] = drafts.map((t) => ({ ...t, readTime: readTimeOf(t.paragraphs) }));

/** Published tales: written, with the wide still that opens the page. Anything short of that is not shown anywhere. */
export const tales: Tale[] = allTales.filter((t) => t.complete && siteImage(`tale-${t.slug}`));

export const taleBySlug = (slug: string) => tales.find((t) => t.slug === slug);
export const taleForHandle = (handle: string) => tales.find((t) => t.handle === handle);
