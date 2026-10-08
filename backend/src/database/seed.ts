import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';
import { Product } from '../entities/product.entity';
import { Faq } from '../entities/faq.entity';

// Runs on every backend start (docker-entrypoint.sh), so it must only ever
// fill in a brand-new, empty database. It used to "sync" on each start:
// re-inserting any of its placeholder products an admin had deleted, hiding
// every product not in its list, and restoring deleted FAQs — so every
// deploy undid catalog changes made in the admin panel.
export async function seedDatabase(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);
  const productRepository = dataSource.getRepository(Product);

  // A default admin only when there's no admin at all (fresh install), so a
  // deleted or renamed default account is never recreated.
  const adminCount = await userRepository.count({
    where: { role: UserRole.ADMIN },
  });

  if (adminCount === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = userRepository.create({
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    });
    await userRepository.save(admin);
    console.log('✅ Default admin user created (admin@example.com / admin123)');
  }

  // Starter catalog for a fresh install only. Prices are PLACEHOLDERS (EUR).
  const products = [
    {
      name: 'Retatrutide 1mg Research Kit',
      description:
        'Retatrutide is a triple-agonist peptide (GLP-1/GIP/glucagon receptor) referenced in metabolic research literature. This kit includes a 1mg vial, a companion bacteriostatic water vial for reconstitution, and a syringe.',
      shortDescription: 'Triple-agonist peptide kit — 1mg vial, bac water, 1 syringe',
      price: 149.99,
      image: '/api/placeholder/400/400',
      category: 'GLP-1 Research Peptides',
      inStock: true,
      stockLevel: 50,
      isActive: true,
      isVisible: true,
      specifications: JSON.stringify([
        'Peptide: Retatrutide',
        'Vial size: 1mg',
        'Kit includes: 1x Bacteriostatic Water vial, 1x Syringe',
        'Purity: see Certificate of Analysis',
      ]),
      usage:
        'For laboratory research use only. Reconstitute with the included bacteriostatic water following standard laboratory protocol.',
      storage:
        'Store lyophilized vial frozen at -20°C. Once reconstituted, refrigerate at 2-8°C.',
      warnings: JSON.stringify([
        'For laboratory research use only',
        'Not for human or veterinary use',
        'Not approved for human consumption',
      ]),
    },
    {
      name: 'Retatrutide 10mg Research Kit',
      description:
        'Retatrutide is a triple-agonist peptide (GLP-1/GIP/glucagon receptor) referenced in metabolic research literature. This kit includes a 10mg vial, a companion bacteriostatic water vial for reconstitution, and 3 syringes.',
      shortDescription: 'Triple-agonist peptide kit — 10mg vial, bac water, 3 syringes',
      price: 349.99,
      image: '/api/placeholder/400/400',
      category: 'GLP-1 Research Peptides',
      inStock: true,
      stockLevel: 40,
      isActive: true,
      isVisible: true,
      specifications: JSON.stringify([
        'Peptide: Retatrutide',
        'Vial size: 10mg',
        'Kit includes: 1x Bacteriostatic Water vial, 3x Syringes',
        'Purity: see Certificate of Analysis',
      ]),
      usage:
        'For laboratory research use only. Reconstitute with the included bacteriostatic water following standard laboratory protocol.',
      storage:
        'Store lyophilized vial frozen at -20°C. Once reconstituted, refrigerate at 2-8°C.',
      warnings: JSON.stringify([
        'For laboratory research use only',
        'Not for human or veterinary use',
        'Not approved for human consumption',
      ]),
    },
    {
      name: 'Tirzepatide 10mg Research Kit',
      description:
        'Tirzepatide is a dual GIP/GLP-1 receptor agonist peptide referenced in metabolic research literature. This kit includes a 10mg vial, a companion bacteriostatic water vial for reconstitution, and 3 syringes.',
      shortDescription: 'Dual GIP/GLP-1 agonist kit — 10mg vial, bac water, 3 syringes',
      price: 299.99,
      image: '/api/placeholder/400/400',
      category: 'GLP-1 Research Peptides',
      inStock: true,
      stockLevel: 40,
      isActive: true,
      isVisible: true,
      specifications: JSON.stringify([
        'Peptide: Tirzepatide',
        'Vial size: 10mg',
        'Kit includes: 1x Bacteriostatic Water vial, 3x Syringes',
        'Purity: see Certificate of Analysis',
      ]),
      usage:
        'For laboratory research use only. Reconstitute with the included bacteriostatic water following standard laboratory protocol.',
      storage:
        'Store lyophilized vial frozen at -20°C. Once reconstituted, refrigerate at 2-8°C.',
      warnings: JSON.stringify([
        'For laboratory research use only',
        'Not for human or veterinary use',
        'Not approved for human consumption',
      ]),
    },
    {
      name: 'Semaglutide (Ozempic) 10mg Research Kit',
      description:
        'Semaglutide is a GLP-1 receptor agonist peptide widely referenced in metabolic research literature. This kit includes a 10mg vial, a companion bacteriostatic water vial for reconstitution, and 3 syringes.',
      shortDescription: 'GLP-1 agonist peptide kit — 10mg vial, bac water, 3 syringes',
      price: 279.99,
      image: '/api/placeholder/400/400',
      category: 'GLP-1 Research Peptides',
      inStock: true,
      stockLevel: 40,
      isActive: true,
      isVisible: true,
      specifications: JSON.stringify([
        'Peptide: Semaglutide',
        'Vial size: 10mg',
        'Kit includes: 1x Bacteriostatic Water vial, 3x Syringes',
        'Purity: see Certificate of Analysis',
      ]),
      usage:
        'For laboratory research use only. Reconstitute with the included bacteriostatic water following standard laboratory protocol.',
      storage:
        'Store lyophilized vial frozen at -20°C. Once reconstituted, refrigerate at 2-8°C.',
      warnings: JSON.stringify([
        'For laboratory research use only',
        'Not for human or veterinary use',
        'Not approved for human consumption',
      ]),
    },
    {
      name: 'Glow Peptide 70mg Blend Kit',
      description:
        'Glow is a multi-peptide blend referenced in cosmetic and tissue-support peptide research. This kit includes a 70mg vial, a companion bacteriostatic water vial for reconstitution, and 5 syringes.',
      shortDescription: 'Multi-peptide research blend — 70mg vial, bac water, 5 syringes',
      price: 199.99,
      image: '/api/placeholder/400/400',
      category: 'Peptide Blends',
      inStock: true,
      stockLevel: 35,
      isActive: true,
      isVisible: true,
      specifications: JSON.stringify([
        'Blend: Glow',
        'Vial size: 70mg',
        'Kit includes: 1x Bacteriostatic Water vial, 5x Syringes',
        'Purity: see Certificate of Analysis',
      ]),
      usage:
        'For laboratory research use only. Reconstitute with the included bacteriostatic water following standard laboratory protocol.',
      storage:
        'Store lyophilized vial frozen at -20°C. Once reconstituted, refrigerate at 2-8°C.',
      warnings: JSON.stringify([
        'For laboratory research use only',
        'Not for human or veterinary use',
        'Not approved for human consumption',
      ]),
    },
    {
      name: 'Klow Peptide 70mg Blend Kit',
      description:
        'Klow is a multi-peptide blend referenced in cosmetic and pigmentation-pathway peptide research. This kit includes a 70mg vial, a companion bacteriostatic water vial for reconstitution, and 5 syringes.',
      shortDescription: 'Multi-peptide research blend — 70mg vial, bac water, 5 syringes',
      price: 199.99,
      image: '/api/placeholder/400/400',
      category: 'Peptide Blends',
      inStock: true,
      stockLevel: 35,
      isActive: true,
      isVisible: true,
      specifications: JSON.stringify([
        'Blend: Klow',
        'Vial size: 70mg',
        'Kit includes: 1x Bacteriostatic Water vial, 5x Syringes',
        'Purity: see Certificate of Analysis',
      ]),
      usage:
        'For laboratory research use only. Reconstitute with the included bacteriostatic water following standard laboratory protocol.',
      storage:
        'Store lyophilized vial frozen at -20°C. Once reconstituted, refrigerate at 2-8°C.',
      warnings: JSON.stringify([
        'For laboratory research use only',
        'Not for human or veterinary use',
        'Not approved for human consumption',
      ]),
    },
  ];

  // Only into an empty catalog. Once any product exists, the catalog belongs
  // to the admin panel: nothing is re-added, hidden or changed here.
  if ((await productRepository.count()) === 0) {
    await productRepository.save(products.map((p) => productRepository.create(p)));
    console.log('✅ Starter product catalog created (placeholder prices — update before launch)');
  }

  // The FAQ page's original content, likewise only for an empty FAQ table.
  const faqRepository = dataSource.getRepository(Faq);
  const faqs = [
    {
      question: 'What are peptides?',
      answer:
        'Peptides are short chains of amino acids that play various roles in biological processes. They are used in research and have potential applications in health and wellness.',
      order: 0,
    },
    {
      question: 'Are your products safe?',
      answer:
        'All our products are manufactured in certified facilities and undergo rigorous quality control. However, our products are for research purposes only and not intended for human consumption unless approved by relevant authorities.',
      order: 1,
    },
    {
      question: 'How do I store peptides?',
      answer:
        'Most peptides should be stored in a freezer at -20°C. Always refer to the specific storage instructions provided with each product. Protect from light and moisture.',
      order: 2,
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept payments through our secure payment gateway, which supports card payments (including local options like Klarna) as well as direct cryptocurrency payments.',
      order: 3,
    },
    {
      question: 'How long does shipping take?',
      answer:
        'Shipping times vary depending on your location. Typically, orders are processed within 1-2 business days, and shipping takes 3-7 business days for domestic orders.',
      order: 4,
    },
    {
      question: 'Can I return or refund my order?',
      answer:
        'We accept returns within 30 days of purchase for unopened products in their original packaging. Please contact our support team to initiate a return.',
      order: 5,
    },
    {
      question: 'Do you ship internationally?',
      answer:
        'Yes, we ship to many countries worldwide. Shipping costs and delivery times vary by location. Please check during checkout for available shipping options to your country.',
      order: 6,
    },
    {
      question: 'Is my personal information secure?',
      answer:
        'Yes, we take data security seriously. All personal information is encrypted and stored securely. We never share your information with third parties except as necessary for order fulfillment.',
      order: 7,
    },
    {
      question: 'Do I need an account to make a purchase?',
      answer:
        'No, you can make purchases as a guest. However, creating an account allows you to track orders, save your information for faster checkout, and access order history.',
      order: 8,
    },
    {
      question: 'How do I track my order?',
      answer:
        "Once your order ships, you will receive a tracking number via email. You can use this number to track your package through the shipping carrier's website.",
      order: 9,
    },
  ];

  if ((await faqRepository.count()) === 0) {
    await faqRepository.save(faqs.map((f) => faqRepository.create(f)));
    console.log('✅ Starter FAQ content created');
  }
}

