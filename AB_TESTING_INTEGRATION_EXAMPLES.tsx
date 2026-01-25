/**
 * INTEGRATION EXAMPLE
 * How to add A/B Testing to Campaign Creation
 */

// 1. Import the component
import ABTestToggle from '@/components/ABTestToggle';
import { ABTestConfig } from '@/lib/types';

// 2. Add state for A/B test config
const [abTestConfig, setAbTestConfig] = useState<ABTestConfig | undefined>(undefined);

// 3. Add the toggle to your form (after campaign name, before submit)
<ABTestToggle
    value={abTestConfig}
    onChange={setAbTestConfig}
/>

// 4. Include in campaign creation payload
const campaignData = {
    name: campaignName,
    platforms: selectedPlatforms,
    criteria: filters,
    ab_test: abTestConfig, // <-- Add this
    // ... other fields
};

// 5. Save to Firestore
await db.collection('creator_requests').add(campaignData);

/**
 * VIEWING RESULTS
 * How to show A/B test results for a campaign
 */

// 1. Import the component
import ABTestResults from '@/components/ABTestResults';

// 2. Add to campaign detail page (after campaign info, before creator list)
{
    campaign.ab_test?.enabled && (
        <ABTestResults campaignId={campaign.id} />
    )
}

/**
 * EXAMPLE: Full Campaign Creation Form
 */

export default function CampaignCreationPage() {
    const [campaignName, setCampaignName] = useState('');
    const [abTestConfig, setAbTestConfig] = useState<ABTestConfig | undefined>(undefined);

    const handleSubmit = async () => {
        const campaignData = {
            name: campaignName,
            user_id: userId,
            platforms: ['instagram'],
            criteria: {},
            ab_test: abTestConfig,
            created_at: new Date().toISOString()
        };

        await db.collection('creator_requests').add(campaignData);
    };

    return (
        <div className="space-y-6">
            {/* Campaign Name */}
            <input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Campaign Name"
            />

            {/* A/B Testing Toggle */}
            <ABTestToggle
                value={abTestConfig}
                onChange={setAbTestConfig}
            />

            {/* Submit */}
            <button onClick={handleSubmit}>
                Create Campaign
            </button>
        </div>
    );
}

/**
 * EXAMPLE: Campaign Results Page
 */

export default function CampaignResultsPage({ campaignId }: { campaignId: string }) {
    const [campaign, setCampaign] = useState<any>(null);

    useEffect(() => {
        // Fetch campaign
        const fetchCampaign = async () => {
            const doc = await db.collection('creator_requests').doc(campaignId).get();
            setCampaign({ id: doc.id, ...doc.data() });
        };
        fetchCampaign();
    }, [campaignId]);

    if (!campaign) return <div>Loading...</div>;

    return (
        <div className="space-y-8">
            {/* Campaign Info */}
            <h1>{campaign.name}</h1>

            {/* A/B Test Results (if enabled) */}
            {campaign.ab_test?.enabled && (
                <ABTestResults campaignId={campaignId} />
            )}

            {/* Creator List */}
            <div>
                {/* ... creator cards ... */}
            </div>
        </div>
    );
}
