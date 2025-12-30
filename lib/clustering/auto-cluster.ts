import { SupabaseClient } from '@supabase/supabase-js';

// Cluster definitions with UUIDs from database
const CLUSTERS = {
  'education-learning': {
    id: '7ccaa361-1c33-47c2-a97e-a2bee35f3841',
    keywords: ['student', 'study', 'learn', 'exam', 'class', 'college', 'teacher', 'teaching', 'syllabus', 'course', 'attendance', 'marks', 'academic', 'education', 'school', 'curriculum', 'grade'],
  },
  'healthcare-medical': {
    id: '04702f3d-7c2f-4e96-ac3c-9a6de265c375',
    keywords: ['health', 'hospital', 'doctor', 'patient', 'medical', 'medicine', 'disease', 'treatment', 'dental', 'bds', 'clinic', 'pharmacy', 'nurse', 'diagnosis', 'therapy'],
  },
  'technology-digital': {
    id: 'c5634057-7b18-47c3-9343-2bbfe09ca699',
    keywords: ['app', 'software', 'digital', 'online', 'internet', 'tech', 'computer', 'phone', 'mobile', 'website', 'automation', 'system'],
  },
  'environment-waste': {
    id: '717a6048-118b-44e5-ae04-e75af6361487',
    keywords: ['waste', 'garbage', 'pollution', 'environment', 'water', 'clean', 'sanitation', 'recycl', 'green', 'climate', 'sustainability'],
  },
  'mental-health-stress': {
    id: 'c3b9a6a5-4d7f-400a-b117-d5a0f4e98189',
    keywords: ['stress', 'anxiety', 'mental', 'depression', 'pressure', 'emotion', 'counsel', 'wellness', 'wellbeing', 'waiting', 'frustrat'],
  },
  'employment-skills': {
    id: '5191d425-6c23-4390-b166-083f08e1251c',
    keywords: ['job', 'employ', 'skill', 'career', 'work', 'placement', 'interview', 'training', 'hostel', 'professional'],
  },
  'communication-awareness': {
    id: 'eac68abe-5645-4cc6-85e2-7e8dc702ec9e',
    keywords: ['awareness', 'inform', 'communicat', 'knowledge', 'understand', 'literacy', 'data', 'information', 'recipe'],
  },
  'documentation-process': {
    id: '4a6bc45b-db9b-4a42-bcab-15876dbe3e04',
    keywords: ['document', 'certificate', 'process', 'paperwork', 'form', 'application', 'government', 'scheme', 'business', 'manual', 'admin'],
  },
  'infrastructure-transport': {
    id: 'b27e5f4b-1842-4e56-b436-2813ad372b57',
    keywords: ['road', 'transport', 'bus', 'traffic', 'building', 'construction', 'electricity', 'power', 'planning', 'infrastructure'],
  },
  'agriculture-farming': {
    id: 'b181619c-51c0-461d-8ec6-38101a4fd33b',
    keywords: ['farm', 'farmer', 'crop', 'agriculture', 'soil', 'harvest', 'irrigation', 'pesticide', 'cattle', 'livestock', 'food', 'rural'],
  },
  'other': {
    id: '66816f02-6261-40d2-bbc4-f296c4d69066',
    keywords: [],
  },
};

/**
 * Classify a problem into the best matching cluster based on content
 */
function classifyProblem(title: string, problemStatement: string): { clusterId: string; score: number } {
  const text = `${title} ${problemStatement}`.toLowerCase();

  let bestMatch = { clusterId: CLUSTERS['other'].id, score: 0 };

  for (const [slug, cluster] of Object.entries(CLUSTERS)) {
    if (slug === 'other') continue;

    let score = 0;
    for (const keyword of cluster.keywords) {
      if (text.includes(keyword)) {
        score++;
      }
    }

    if (score > bestMatch.score) {
      bestMatch = { clusterId: cluster.id, score };
    }
  }

  // If no keywords matched, assign to "other"
  if (bestMatch.score === 0) {
    bestMatch.clusterId = CLUSTERS['other'].id;
    bestMatch.score = 0.5; // Default score for uncategorized
  }

  return bestMatch;
}

/**
 * Auto-assign a problem to the best matching cluster
 * Call this after creating a new problem in problem_bank
 */
export async function autoClusterProblem(
  supabase: SupabaseClient,
  problemId: string,
  title: string,
  problemStatement: string
): Promise<{ success: boolean; clusterId: string | null; error?: string }> {
  try {
    // Classify the problem
    const { clusterId, score } = classifyProblem(title, problemStatement);

    // Normalize score to 0-1 range (max typical score is 5-6 keywords)
    const membershipScore = Math.min(1.0, score / 5.0) || 0.5;

    // Check if already a member
    const { data: existing } = await supabase
      .from('problem_cluster_members')
      .select('cluster_id')
      .eq('problem_id', problemId)
      .single();

    if (existing) {
      // Already assigned, skip
      return { success: true, clusterId: existing.cluster_id };
    }

    // Insert cluster membership
    const { error: insertError } = await supabase
      .from('problem_cluster_members')
      .insert({
        cluster_id: clusterId,
        problem_id: problemId,
        membership_score: membershipScore,
        is_centroid: false,
        added_by: 'auto',
      });

    if (insertError) {
      console.error('Error inserting cluster membership:', insertError);
      return { success: false, clusterId: null, error: insertError.message };
    }

    // Update cluster problem_count directly
    const { data: cluster } = await supabase
      .from('problem_clusters')
      .select('problem_count')
      .eq('id', clusterId)
      .single();

    if (cluster) {
      await supabase
        .from('problem_clusters')
        .update({
          problem_count: (cluster.problem_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', clusterId);
    }

    return { success: true, clusterId };
  } catch (error) {
    console.error('Error in autoClusterProblem:', error);
    return { success: false, clusterId: null, error: String(error) };
  }
}

/**
 * Get cluster info for a problem (used for display)
 */
export async function getProblemCluster(
  supabase: SupabaseClient,
  problemId: string
): Promise<{ clusterId: string; clusterName: string } | null> {
  try {
    const { data, error } = await supabase
      .from('problem_cluster_members')
      .select(`
        cluster_id,
        problem_clusters!inner(name)
      `)
      .eq('problem_id', problemId)
      .single();

    if (error || !data) return null;

    // Handle the nested relation type
    const clusterData = data.problem_clusters as unknown;
    const clusterName = Array.isArray(clusterData)
      ? (clusterData[0] as { name: string })?.name
      : (clusterData as { name: string })?.name;

    return {
      clusterId: data.cluster_id,
      clusterName: clusterName || 'Unknown',
    };
  } catch {
    return null;
  }
}
