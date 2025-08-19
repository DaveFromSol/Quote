// Vercel serverless function for sending booking emails
const Mailjet = require('node-mailjet');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { customer, service, timestamp } = req.body;

    // Initialize Mailjet
    const mailjet = Mailjet.apiConnect(
      '7fac35e70c085b433e24f468c69b0c5b', // Your API key
      '46c18f1298e91051cd745c155ad43cef'  // Your secret key
    );

    const emailData = {
      Messages: [
        {
          From: {
            Email: "david.richter1212@gmail.com",
            Name: "Lawn Care Quote System"
          },
          To: [
            {
              Email: "david.richter1212@gmail.com",
              Name: "David Richter"
            }
          ],
          Subject: `New Lawn Care Booking - ${customer.firstName} ${customer.lastName}`,
          TextPart: `
NEW LAWN CARE BOOKING RECEIVED

Customer Information:
• Name: ${customer.firstName} ${customer.lastName}
• Email: ${customer.email}
• Phone: ${customer.phone}
• Preferred Date: ${customer.preferredDate}
• Preferred Time: ${customer.preferredTime || 'Any time'}

Service Details:
• Property Address: ${service.address}
• Lawn Area: ${service.lawnArea.toLocaleString()} sq ft (${(service.lawnArea / 43560).toFixed(3)} acres)
• Service Frequency: ${service.frequency}
• Price per Visit: $${service.pricePerVisit.toFixed(2)}
• Annual Total: $${service.annualTotal.toFixed(2)}
• Number of Areas Selected: ${service.selectionCount || 1}

Special Instructions:
${customer.notes || 'None'}

Booking Time: ${new Date(timestamp).toLocaleString()}
          `,
          HTMLPart: `
<h2>NEW LAWN CARE BOOKING RECEIVED</h2>

<h3>Customer Information:</h3>
<ul>
  <li><strong>Name:</strong> ${customer.firstName} ${customer.lastName}</li>
  <li><strong>Email:</strong> ${customer.email}</li>
  <li><strong>Phone:</strong> ${customer.phone}</li>
  <li><strong>Preferred Date:</strong> ${customer.preferredDate}</li>
  <li><strong>Preferred Time:</strong> ${customer.preferredTime || 'Any time'}</li>
</ul>

<h3>Service Details:</h3>
<ul>
  <li><strong>Property Address:</strong> ${service.address}</li>
  <li><strong>Lawn Area:</strong> ${service.lawnArea.toLocaleString()} sq ft (${(service.lawnArea / 43560).toFixed(3)} acres)</li>
  <li><strong>Service Frequency:</strong> ${service.frequency}</li>
  <li><strong>Price per Visit:</strong> $${service.pricePerVisit.toFixed(2)}</li>
  <li><strong>Annual Total:</strong> $${service.annualTotal.toFixed(2)}</li>
  <li><strong>Number of Areas Selected:</strong> ${service.selectionCount || 1}</li>
</ul>

<h3>Special Instructions:</h3>
<p>${customer.notes || 'None'}</p>

<p><strong>Booking Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
          `
        }
      ]
    };

    const result = await mailjet.post('send', { version: 'v3.1' }).request(emailData);
    
    console.log('Email sent successfully:', result.body);
    res.json({ success: true, message: 'Booking email sent successfully' });
    
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}