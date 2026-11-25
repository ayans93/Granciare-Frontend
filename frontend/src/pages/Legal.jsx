/**
 * Privacy Policy and Terms & Conditions.
 * DRAFT wording based on how the website handles data today — to be reviewed
 * by the estate's legal adviser before public launch.
 */
import { useTranslation } from '../i18n/LanguageContext';
import './Legal.css';

const UPDATED = '17 November 2026';

function LegalPage({ title, children }) {
  const { t } = useTranslation();
  const note = t('legal.englishOnly');
  return (
    <section className="legal-page">
      <div className="container">
        <h1 className="section-title">{title}</h1>
        <p className="legal-note">{t('legal.updated', { date: UPDATED })}</p>
        {note && note !== 'legal.englishOnly' && <p className="legal-note">{note}</p>}
        <div className="legal-body">{children}</div>
      </div>
    </section>
  );
}

export function PrivacyPolicy() {
  const { t } = useTranslation();
  return (
    <LegalPage title={t('footer.privacy')}>
      <h2>Who we are</h2>
      <p>Granciare Estate, Allerona (TR), Umbria, Italy ("we", "us") is responsible for the personal data collected through granciare.com. Contact: <a href="mailto:info@granciare.com">info@granciare.com</a> / <a href="mailto:enquiry@granciare.com">enquiry@granciare.com</a>.</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Stay enquiries:</strong> name, email, phone number, travel dates, number of guests, special requests and any message you add.</li>
        <li><strong>Solivé orders:</strong> name, email, phone number, delivery address, quantity and any message you add.</li>
        <li><strong>Mailing lists:</strong> your email (and name, if given) when you register interest in Poderetto or the next Solivé harvest.</li>
        <li><strong>On your device:</strong> your language choice and preview sign-in are stored in your browser so the site remembers them.</li>
      </ul>

      <h2>Why we use it</h2>
      <p>To answer your enquiry, arrange and confirm your stay or order, deliver your oil, and, only if you asked, tell you about Poderetto or a new harvest. The legal bases are taking steps at your request before a contract, performing the contract, and your consent for mailing lists.</p>

      <h2>Who processes it</h2>
      <p>Your data is stored with service providers that act on our behalf: Supabase (database), Google (Gmail and Google Sheets), and Vercel (website hosting). Bookings confirmed in our system appear in our calendar feed only as "Booked", without your name or details. We do not sell your data.</p>

      <h2>How long we keep it</h2>
      <p>Enquiries that do not lead to a booking are deleted within 24 months. Booking and order records are kept as long as Italian tax and accounting rules require. Mailing-list entries are kept until you unsubscribe.</p>

      <h2>Your rights</h2>
      <p>You can ask to access, correct, delete or export your data, object to its use, or withdraw consent at any time by emailing <a href="mailto:info@granciare.com">info@granciare.com</a> / <a href="mailto:enquiry@granciare.com">enquiry@granciare.com</a>. You may also complain to the Italian data protection authority (Garante per la protezione dei dati personali).</p>
    </LegalPage>
  );
}

export function TermsConditions() {
  const { t } = useTranslation();
  return (
    <LegalPage title={t('footer.termsConditions')}>
      <h2>Enquiries are not bookings</h2>
      <p>Sending a stay enquiry or a Solivé order request does not create a booking or a sale. We reply personally to confirm availability, the final price and payment terms. A stay is confirmed only once we have confirmed it in writing and received the agreed deposit.</p>

      <h2>Prices</h2>
      <p>Prices shown on the website, including the stay estimate, are indicative and in euros. The final price is the one we confirm in writing.</p>

      <h2>Stays</h2>
      <ul>
        <li>Stays are for exclusive use of the estate, for 2 to 30 nights and up to 16 guests.</li>
        <li>Deposit, balance, cancellation and security-deposit terms are set out in your booking confirmation.</li>
        <li>Guests are asked to respect the estate, its neighbours and the house rules shared before arrival.</li>
      </ul>

      <h2>Solivé orders</h2>
      <ul>
        <li>Solivé comes in 250 ml, 500 ml and 5 L bottles. Orders of 250 ml and 500 ml bottles are limited to 3 L in total; 5 L bottles are limited to 10 per order and ship only to Europe and the USA. Shipping costs and delivery times depend on the destination and are confirmed with your order.</li>
        <li>Please check your bottles on delivery and tell us within 7 days if anything arrived damaged.</li>
        <li>EU consumers keep their statutory rights, including the right of withdrawal where it applies to food products.</li>
      </ul>

      <h2>Contact</h2>
      <p>Granciare Estate, Allerona (TR), Umbria, Italy · <a href="mailto:info@granciare.com">info@granciare.com</a> / <a href="mailto:enquiry@granciare.com">enquiry@granciare.com</a> · +39 0763 630996</p>
    </LegalPage>
  );
}
