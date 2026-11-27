/** Help-centre questions. Shown on /help, with FAQ structured data for search engines. */
export const FAQ: { group: string; items: { q: string; a: string; link?: { href: string; label: string } }[] }[] = [
  {
    group: "Ordering",
    items: [
      {
        q: "How do I place an order?",
        a: "Add items to your bag, enter your name, phone number and delivery address, and place the order. You get an order reference straight away, and we open WhatsApp with your order already written so you can send it to us.",
        link: { href: "/#how-it-works", label: "How ordering works" },
      },
      { q: "Do I need an account?", a: "No. There are no accounts or passwords. Your order reference and WhatsApp chat are all you need." },
      {
        q: "Is my order confirmed when I place it?",
        a: "Your order is saved and the stock is held for you, but it's confirmed once our team replies on WhatsApp with the total, delivery fee and payment details.",
      },
      { q: "Can I change or cancel my order?", a: "Yes. Message us on WhatsApp with your order reference before it's dispatched and we'll update or cancel it." },
    ],
  },
  {
    group: "Payment & delivery",
    items: [
      { q: "How do I pay?", a: "You don't pay on the website. When we confirm your order on WhatsApp we share the payment options and the final total." },
      {
        q: "Do you deliver islandwide?",
        a: "Yes, we deliver anywhere in Sri Lanka. The delivery fee and estimated time are confirmed with you on WhatsApp.",
        link: { href: "/delivery-returns", label: "Delivery & returns" },
      },
      { q: "How can I check my order status?", a: "Send us your order reference (it starts with ORK-) on WhatsApp and we'll update you." },
    ],
  },
  {
    group: "Sizing & care",
    items: [
      {
        q: "How do your sizes fit?",
        a: "Most of our pieces have an oversized, relaxed fit. Take your usual size for the boxy look, or one size down for a closer fit.",
        link: { href: "/size-guide", label: "Size guide" },
      },
      { q: "How should I wash my ORACK pieces?", a: "Wash inside out in cold water, don't tumble dry, and never iron directly on a print. Your prints will stay sharp for longer." },
      {
        q: "Can I return or exchange an item?",
        a: "If something arrives faulty, damaged or not what you ordered, tell us on WhatsApp and we'll put it right. Size exchanges depend on stock.",
        link: { href: "/delivery-returns#returns", label: "Returns & exchanges" },
      },
    ],
  },
  {
    group: "Custom designs",
    items: [
      {
        q: "How do custom designs work?",
        a: "Choose your piece, colour, size and print placement, describe your idea and upload reference images. We review it and send a quote on WhatsApp. Nothing is printed or charged until you accept.",
        link: { href: "/customize", label: "Start a custom design" },
      },
      { q: "Who can see the images I upload?", a: "Only our team. Reference images are stored privately and are never shown on the website." },
      { q: "Can I print any image?", a: "Only images you own or have permission to use. We can't print other brands' logos, characters or copyrighted artwork." },
    ],
  },
];
