/** Renders a JSON-LD block.
 *
 *  Next strips unknown props from <script>, so structured data has to go in via
 *  dangerouslySetInnerHTML. Wrapping it here keeps that one awkward line in a
 *  single place instead of on every page that needs schema.
 */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
