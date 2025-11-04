import React, { useEffect, useRef, useState } from 'react';
// FIX: Replace single D3 import with modular imports to resolve TypeScript errors with the d3 namespace.
import { drag } from 'd3-drag';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import { select, Selection } from 'd3-selection';
import { zoom, zoomIdentity } from 'd3-zoom';
import { X, Link as LinkIcon, Shuffle, MapPin, PlusCircle, MinusCircle } from 'lucide-react';

// Graph data moved outside the component to prevent re-initialization on re-renders
const graphData = {
  nodes: [
    // ========== CORE CONCEPTS (5) ==========
    { id: 'ilp', label: 'Integral Life Practice', category: 'core', description: 'A comprehensive, cross-training framework for human development. It integrates practices across four core modules—Body, Mind, Spirit, and Shadow—to foster balanced and sustainable growth, leading to greater wholeness and effectiveness in life.', importance: 10 },
    { id: 'body-module', label: 'Body Module', category: 'core', description: 'Focuses on physical well-being through practices that cultivate health, strength, and energy. It addresses everything from exercise and nutrition to rest and nervous system regulation, forming the foundation for all other modules.', importance: 9 },
    { id: 'mind-module', label: 'Mind Module', category: 'core', description: 'Aims to develop cognitive capacity and awareness. This involves both "vertical" growth through stages of consciousness and "horizontal" skill-building, such as understanding personality types, mental models, and managing cognitive biases.', importance: 9 },
    { id: 'spirit-module', label: 'Spirit Module', category: 'core', description: 'Engages practices that connect you to deeper states of being and meaning. It includes meditation, contemplation, and other techniques to cultivate presence, compassion, and a felt sense of transcendence beyond the ego.', importance: 9 },
    { id: 'shadow-module', label: 'Shadow Module', category: 'core', description: 'The practice of exploring and integrating unconscious or disowned aspects of the self. By facing and owning these "shadow" parts, you reclaim energy, reduce psychological triggers, and move toward greater authenticity and wholeness.', importance: 9 },
    
    // ========== BODY MODULE (25) ==========
    { id: 'sleep', label: 'Sleep Foundation', category: 'body', description: 'The non-negotiable foundation of physical and mental health. Consistent, high-quality sleep is when the body and brain repair tissue, consolidate learning, regulate hormones, and process emotions. Most other practices are ineffective without it.', importance: 10 },
    { id: 'resistance-training', label: 'Resistance Training', category: 'body', description: 'Building and maintaining muscle and bone density through strength-based exercise. This is crucial for metabolic health, hormonal balance, and longevity, with grip strength being a key predictor of all-cause mortality.', importance: 8 },
    { id: 'zone2-cardio', label: 'Zone 2 Cardio', category: 'body', description: 'Low-intensity aerobic exercise performed at a conversational pace. This builds your cardiovascular base, improves mitochondrial efficiency for better energy production, and is one of the strongest drivers of a longer, healthier life.', importance: 8 },
    { id: 'nutrition', label: 'Nutrition Foundation', category: 'body', description: 'Fueling your body with the right building blocks. This practice emphasizes hitting adequate protein targets for muscle maintenance, prioritizing whole foods for micronutrients, and ensuring proper hydration for optimal systemic function.', importance: 8 },
    { id: 'mobility', label: 'Mobility & Stretching', category: 'body', description: 'Maintaining and improving your functional range of motion through targeted stretching and movement. This practice helps prevent injury, counteracts the negative effects of prolonged sitting, and ensures your body remains supple and resilient.', importance: 6 },
    { id: '3-body-workout', label: '3-Body Workout', category: 'body', description: 'An integrated approach that exercises the physical (gross), subtle (energetic), and causal (spacious awareness) dimensions of your being. This cultivates a profound sense of embodied presence across all levels of reality.', importance: 7 },
    { id: 'physical-body', label: 'Physical Body', category: 'body', description: 'The gross, material dimension of your being—your flesh, bones, and organs. Practices for this body focus on building strength, endurance, and structural integrity through conventional exercise and physical therapies.', importance: 7 },
    { id: 'subtle-body', label: 'Subtle Body', category: 'body', description: 'The energetic dimension of your being, known as prana, chi, or life force. Practices for this body, like yoga and breathwork, focus on cultivating and directing this energy for vitality and awareness.', importance: 6 },
    { id: 'causal-body', label: 'Causal Body', category: 'body', description: 'The dimension of pure, formless awareness and infinite spaciousness. This is the unmanifest ground of being, often accessed through deep meditation, which serves as the ultimate source of peace and rest.', importance: 6 },
    { id: 'yoga', label: 'Yoga', category: 'body', description: 'An ancient system of practices that integrates the physical and subtle bodies. Through postures (asanas), breathwork (pranayama), and meditation, yoga cultivates strength, flexibility, energy awareness, and mental clarity simultaneously.', importance: 6 },
    { id: 'tai-chi', label: 'Tai Chi', category: 'body', description: 'An internal Chinese martial art often described as "meditation in motion." It integrates slow, flowing movements with deep breathing and focused intention to cultivate subtle energy, balance, and a calm, centered mind.', importance: 5 },
    { id: 'qigong', label: 'Qigong', category: 'body', description: 'A traditional Chinese practice of energy cultivation. It involves coordinating slow, gentle movements with breathing techniques and focused intention to improve the flow of chi (life force), promoting health, vitality, and tranquility.', importance: 5 },
    { id: 'breathwork', label: 'Breathwork', category: 'body', description: 'The conscious and systematic use of breathing techniques to influence your physiological and psychological state. It\'s a direct lever to regulate the nervous system, manage stress, alter consciousness, and release stored emotions.', importance: 7 },
    { id: 'hrv', label: 'Heart Rate Variability', category: 'body', description: 'A key biomarker measuring the variation in time between heartbeats. Higher HRV indicates a healthy, resilient autonomic nervous system that can adeptly shift between stress (fight-or-flight) and relaxation (rest-and-digest) states.', importance: 5 },
    { id: 'mitochondria', label: 'Mitochondrial Health', category: 'body', description: 'Optimizing the function of your cellular "power plants." Healthy mitochondria are essential for energy production, metabolic function, and longevity. They are primarily improved through practices like Zone 2 cardio and good nutrition.', importance: 5 },
    { id: 'nervous-system', label: 'Nervous System', category: 'body', description: 'The body\'s command center, governing both voluntary and involuntary functions. Practices that target the nervous system aim to build its capacity for regulation, allowing for graceful shifts between states of alertness and calm.', importance: 6 },
    { id: 'hormones', label: 'Hormonal Balance', category: 'body', description: 'The chemical messengers that regulate nearly every process in your body, from metabolism to mood. Practices like resistance training and quality sleep are key to maintaining a balanced and optimized endocrine system.', importance: 6 },
    { id: 'recovery', label: 'Recovery', category: 'body', description: 'The process of rest and regeneration that allows the body to adapt and grow stronger from stress. It includes sleep, proper nutrition, and active techniques like stretching to ensure the system is not chronically overtaxed.', importance: 6 },
    { id: 'posture', label: 'Posture', category: 'body', description: 'The structural alignment of your body. Good posture reduces strain on muscles and joints, improves breathing, and can even influence mood and confidence. It is a foundational aspect of physical presence and well-being.', importance: 5 },
    { id: 'cold-exposure', label: 'Cold Exposure', category: 'body', description: 'Using cold temperatures (like cold showers or plunges) as a hormetic stressor. This practice can improve mood by increasing dopamine, boost metabolic health, and build mental resilience by voluntarily embracing discomfort.', importance: 4 },
    { id: 'heat-exposure', label: 'Heat/Sauna', category: 'body', description: 'Using heat (like a sauna) to induce a beneficial stress response. This practice can improve cardiovascular health, support detoxification through sweat, and has been linked to significant longevity benefits.', importance: 4 },
    { id: 'circadian', label: 'Circadian Rhythm', category: 'body', description: 'Your body\'s internal 24-hour clock that regulates the sleep-wake cycle. Aligning your behaviors, particularly light exposure and meal timing, with this natural rhythm is fundamental for quality sleep and overall health.', importance: 6 },
    { id: 'hydration', label: 'Hydration', category: 'body', description: 'Ensuring adequate water intake for all physiological functions. Proper hydration is critical for cellular health, cognitive performance, energy levels, and the transportation of nutrients throughout the body.', importance: 5 },
    { id: 'micronutrients', label: 'Micronutrients', category: 'body', description: 'The essential vitamins and minerals your body needs in small amounts for proper function. A diet rich in whole, unprocessed foods is the best way to ensure you are getting a full spectrum of these vital nutrients.', importance: 5 },
    { id: 'protein', label: 'Protein', category: 'body', description: 'The essential macronutrient that serves as the building block for all bodily tissues, including muscle, bone, and skin. Consuming adequate protein is critical for recovery, satiety, and maintaining metabolic health.', importance: 6 },
    
    // ========== MIND MODULE (25) ==========
    { id: 'vertical', label: 'Vertical Development', category: 'mind', description: 'The process of transforming your entire worldview to a more complex and inclusive level. It\'s not about learning more things, but about upgrading the very operating system through which you make sense of reality.', importance: 8 },
    { id: 'horizontal', label: 'Horizontal Development', category: 'mind', description: 'The process of developing skills and knowledge within your current stage of development. This includes learning new information, improving competencies, and exploring different personality typologies like the Enneagram to understand your patterns.', importance: 8 },
    { id: 'kegan', label: "Kegan's Orders", category: 'mind', description: 'A renowned model of adult development that maps five distinct "orders of consciousness." Each stage represents a fundamental shift in how a person understands themselves and their relationship to the world, particularly through subject-object moves.', importance: 8 },
    { id: 'subject-object', label: 'Subject-Object', category: 'mind', description: 'The core mechanism of vertical development. What you are "subject to" (unconsciously identified with) runs you. When you can make it "object" (something you can observe and relate to), you gain agency over it.', importance: 7 },
    { id: 'order3', label: 'Order 3: Socialized', category: 'mind', description: 'The "Socialized Mind" stage, where identity, beliefs, and values are primarily defined by one\'s relationships and social environment. Approval from others and adherence to group norms are paramount for feeling secure.', importance: 6 },
    { id: 'order4', label: 'Order 4: Self-Authoring', category: 'mind', description: 'The "Self-Authoring Mind" stage, where an individual develops their own internal belief system and values. They are able to take perspective on external influences and make decisions based on their self-generated inner compass.', importance: 7 },
    { id: 'order5', label: 'Order 5: Self-Transforming', category: 'mind', description: 'The "Self-Transforming Mind" stage, where one understands that their own identity and frameworks are not fixed. They can hold multiple complex systems and perspectives simultaneously, seeing them as fluid rather than absolute.', importance: 6 },
    { id: 'spiral-dynamics', label: 'Spiral Dynamics', category: 'mind', description: 'A model that describes the evolution of human consciousness and worldviews through a series of value systems, or "vMemes." Each stage has a different way of thinking and a different set of life priorities.', importance: 8 },
    { id: 'blue', label: 'Blue vMeme', category: 'mind', description: 'A vMeme characterized by order, rules, and tradition. It finds meaning in a higher purpose and a defined moral code, valuing loyalty, authority, and stability. This stage provides structure after chaotic individualism.', importance: 5 },
    { id: 'orange', label: 'Orange vMeme', category: 'mind', description: 'A vMeme driven by achievement, rationality, and strategic success. It values science, progress, and individual accomplishment, seeking the "best" and most effective ways to achieve its goals in the material world.', importance: 6 },
    { id: 'green', label: 'Green vMeme', category: 'mind', description: 'A vMeme that is pluralistic, sensitive, and community-oriented. It values equality, feelings, and social justice, seeking to liberate all people from oppression and dogma. It emphasizes connection and shared human experience.', importance: 6 },
    { id: 'yellow', label: 'Yellow vMeme', category: 'mind', description: 'The first "second-tier" vMeme, characterized by systemic and integrative thinking. It can see the value and limitations of all previous stages, understanding life as a complex interplay of dynamic systems.', importance: 7 },
    { id: 'second-tier', label: 'Second Tier', category: 'mind', description: 'A major leap in consciousness where one can see the entire spiral of development and appreciate the necessary role of each vMeme. Thinking becomes more flexible, systemic, and capable of holding multiple complex perspectives.', importance: 6 },
    { id: 'enneagram', label: 'Enneagram', category: 'mind', description: 'A powerful personality typology that describes nine core motivations and fears. It acts as a map to understand your automatic patterns, blind spots, and path to growth, revealing the "why" behind your behavior.', importance: 8 },
    { id: 'ifs', label: 'Internal Family Systems', category: 'mind', description: 'A therapeutic model that views the mind as being naturally made up of multiple "parts" and a core "Self." It provides a compassionate way to understand and heal internal conflicts by relating to all parts with curiosity.', importance: 8 },
    { id: 'self', label: 'Self (IFS)', category: 'mind', description: 'In the IFS model, the core of who you are—your innate consciousness that is characterized by qualities like compassion, curiosity, calm, and confidence. The goal of IFS is to lead from this core Self.', importance: 7 },
    { id: 'parts', label: 'Parts', category: 'mind', description: 'Sub-personalities or aspects of our psyche that have their own beliefs, feelings, and roles. IFS recognizes that all parts have a positive intent, even if their strategies are problematic, and seeks to understand them.', importance: 6 },
    { id: 'managers', label: 'Manager Parts', category: 'mind', description: 'Proactive protector parts that try to control your life to avoid pain and keep exiled parts from being triggered. They manifest as inner critics, planners, and people-pleasers, striving for safety and control.', importance: 6 },
    { id: 'exiles', label: 'Exile Parts', category: 'mind', description: 'Young, wounded parts that hold the pain and trauma from past experiences. They are often locked away by managers to prevent their overwhelming feelings from surfacing, but they carry the burdens of our history.', importance: 6 },
    { id: 'mental-models', label: 'Mental Models', category: 'mind', description: 'Frameworks or concepts that shape how we understand the world and our relationship to it. Deliberately learning new models gives you a more versatile toolkit for thinking and problem-solving.', importance: 7 },
    { id: 'cognitive-biases', label: 'Cognitive Biases', category: 'mind', description: 'Systematic errors in thinking that affect our judgments and decisions. Becoming aware of these unconscious shortcuts, like confirmation bias, allows for more rational and clear-headed thought.', importance: 7 },
    { id: 'metacognition', label: 'Metacognition', category: 'mind', description: 'The ability to "think about your thinking." It is the awareness and understanding of one\'s own thought processes, which is a crucial skill for self-correction, learning, and conscious development.', importance: 7 },
    { id: 'systems-thinking', label: 'Systems Thinking', category: 'mind', description: 'The ability to see the world in terms of interconnected wholes and relationships rather than isolated parts. It helps in understanding complex problems by focusing on the patterns and dynamics within the larger system.', importance: 7 },
    { id: 'polarity', label: 'Polarity Management', category: 'mind', description: 'A pair of interdependent opposites that need each other over time, like "activity and rest." Polarity management is the skill of leveraging the tension between these poles, rather than treating them as problems to be solved.', importance: 6 },
    { id: 'perspective-taking', label: 'Perspective-Taking', category: 'mind', description: 'The active and deliberate practice of trying to see a situation from another person\'s point of view. It is a fundamental skill for developing empathy, compassion, and more advanced stages of cognitive development.', importance: 7 },
    
    // ========== SPIRIT MODULE (25) ==========
    { id: 'meditation', label: 'Daily Meditation', category: 'spirit', description: 'The core practice of training attention and awareness. It typically involves focusing on an object like the breath and gently returning your focus when the mind wanders, strengthening your capacity for presence and emotional regulation.', importance: 9 },
    { id: 'mindfulness', label: 'Mindfulness', category: 'spirit', description: 'The quality of paying attention to the present moment with non-judgmental awareness. It\'s not just a formal practice, but a way of being that can be cultivated and brought into any aspect of daily life.', importance: 8 },
    { id: 'gratitude', label: 'Gratitude Practice', category: 'spirit', description: 'The intentional practice of noticing and appreciating the good things in your life. With an exceptionally high return on investment, it effectively rewires the brain to scan for positives, boosting well-being and resilience.', importance: 9 },
    { id: 'loving-kindness', label: 'Loving-Kindness', category: 'spirit', description: 'A form of meditation (Metta) aimed at cultivating unconditional goodwill and compassion for oneself and others. It is a direct antidote to the inner critic, resentment, and feelings of isolation.', importance: 7 },
    { id: 'nature-exposure', label: 'Nature Exposure', category: 'spirit', description: 'Intentionally spending time in natural settings. Research shows this practice reduces stress, restores attention, improves mood, and can induce feelings of awe, connecting you to something larger than yourself.', importance: 7 },
    { id: 'prayer', label: 'Prayer', category: 'spirit', description: 'A form of spiritual practice that involves relating to the divine as a "Thou" or a higher power. It cultivates humility, devotion, and a sense of relationship with a source of guidance and support.', importance: 6 },
    { id: 'contemplation', label: 'Contemplation', category: 'spirit', description: 'A practice of deep, sustained reflection on a spiritual question, text, or concept. Unlike meditation\'s focus on non-thought, contemplation uses the mind to explore profound truths and seek deeper meaning.', importance: 7 },
    { id: 'witness', label: 'Witness Consciousness', category: 'spirit', description: 'The impartial, observing aspect of your consciousness. It is the part of you that can notice your thoughts, feelings, and sensations without being identified with them. Cultivating the Witness is key to dis-identification and freedom.', importance: 7 },
    { id: 'big-mind', label: 'Big Mind', category: 'spirit', description: 'A practice, often done through dialogue, that allows you to access a state of non-dual awareness. It helps you recognize your identity as the vast, open consciousness that includes all perspectives, rather than a limited ego.', importance: 6 },
    { id: '1st-person', label: '1st-Person Spirit', category: 'spirit', description: 'Experiencing Spirit as your own deepest Self or pure awareness ("I AM"). This is the perspective of the Witness, the formless consciousness that is the silent, ever-present background to all of your experiences.', importance: 6 },
    { id: '2nd-person', label: '2nd-Person Spirit', category: 'spirit', description: 'Relating to Spirit as a "Thou"—an intimate, personal, and relational divine presence. This is the perspective of prayer and devotion, where you commune with a source of love and guidance outside of yourself.', importance: 6 },
    { id: '3rd-person', label: '3rd-Person Spirit', category: 'spirit', description: 'Viewing Spirit as the objective "It" or "Its"—the grand, interconnected web of existence and the cosmic order of the universe. This is the perspective of awe, wonder, and contemplation of the Great Perfection.', importance: 6 },
    { id: 'states', label: 'States of Consciousness', category: 'spirit', description: 'Temporary, fleeting experiences of different kinds of consciousness, such as peak states of flow, altered states from meditation, or dream states. They provide a glimpse of what\'s possible but are not permanent structures.', importance: 7 },
    { id: 'stages', label: 'Stages vs States', category: 'spirit', description: 'Lasting, durable structures of consciousness that represent your baseline level of development. Unlike temporary states, stages must be earned through consistent practice and integration, fundamentally changing your worldview.', importance: 7 },
    { id: 'mbsr', label: 'MBSR', category: 'spirit', description: 'A well-researched, secular program that uses mindfulness meditation to help people cope with stress, anxiety, pain, and illness. It systematically trains the mind to respond to challenges with greater awareness and calm.', importance: 6 },
    { id: 'equanimity', label: 'Equanimity', category: 'spirit', description: 'A state of mental calmness, composure, and evenness of temper, especially in a difficult situation. It is the ability to meet life\'s ups and downs with a balanced and open heart, without being thrown off center.', importance: 7 },
    { id: 'presence', label: 'Presence', category: 'spirit', description: 'The quality of being fully here, now. It is a state of attentive awareness where your mind is not lost in the past or future, allowing you to engage with the richness of the present moment.', importance: 7 },
    { id: 'awe', label: 'Awe', category: 'spirit', description: 'The feeling of reverential respect mixed with fear or wonder, often triggered by something vast that challenges your current understanding of the world. Awe can diminish the ego and increase feelings of connection.', importance: 6 },
    { id: 'meaning', label: 'Meaning-Making', category: 'spirit', description: 'The active process of finding purpose and significance in one\'s life experiences, especially challenging ones. It is a core spiritual practice that transforms suffering into growth and builds a resilient sense of identity.', importance: 7 },
    { id: 'transcendence', label: 'Transcendence', category: 'spirit', description: 'The experience of going beyond your ordinary sense of self and ego. It involves a shift in identity from a separate individual to a feeling of connection with a larger whole, be it humanity, nature, or the cosmos.', importance: 6 },
    { id: 'devotion', label: 'Devotion', category: 'spirit', description: 'A spiritual path (Bhakti) that emphasizes love, surrender, and a heartfelt connection to a divine source. It uses emotion and relationship as the primary vehicles for spiritual opening and transformation.', importance: 5 },
    { id: 'service', label: 'Selfless Service', category: 'spirit', description: 'The practice of acting for the benefit of others without expecting personal reward (Karma Yoga or Seva). It helps to purify the ego by shifting focus from "what\'s in it for me?" to "how can I help?"', importance: 6 },
    { id: 'retreat', label: 'Meditation Retreat', category: 'spirit', description: 'A period of dedicated, intensive practice away from one\'s ordinary life. Retreats provide a powerful container to deepen meditation, gain insight, and stabilize awareness in a supportive, distraction-free environment.', importance: 5 },
    { id: 'attention', label: 'Attention Training', category: 'spirit', description: 'The cognitive faculty of selectively concentrating on one aspect of the environment while ignoring other things. Formal meditation is the primary method for training and strengthening this fundamental capacity of the mind.', importance: 7 },
    { id: 'compassion', label: 'Compassion', category: 'spirit', description: 'The ability to feel for the suffering of another and be moved to help. It combines empathy (feeling with) and loving-kindness (wishing well) into an active expression of care.', importance: 7 },
    
    // ========== SHADOW MODULE (20) ==========
    { id: 'shadow-work', label: 'Shadow Work', category: 'shadow', description: 'The courageous process of bringing unconscious and disowned parts of your personality into conscious awareness. This act of integration reclaims projected energy, reduces emotional reactivity, and leads to greater wholeness.', importance: 9 },
    { id: '3-2-1-process', label: '3-2-1 Process', category: 'shadow', description: 'A core Integral practice for working with projections. It uses a three-step journaling process (Face It, Talk to It, Be It) to identify and reintegrate a disowned quality that you see in another person.', importance: 8 },
    { id: 'projection', label: 'Projection', category: 'shadow', description: 'The unconscious defense mechanism of attributing your own unacknowledged qualities—both positive and negative—onto another person. What intensely irritates or fascinates you in others often points to a disowned part of yourself.', importance: 8 },
    { id: 'disowned-self', label: 'Disowned Self', category: 'shadow', description: 'Aspects of your personality that you have rejected or repressed, usually because they were not approved of in your early environment. These parts don\'t disappear; they live in the unconscious as your "shadow."', importance: 7 },
    { id: 'golden-shadow', label: 'Golden Shadow', category: 'shadow', description: 'The positive or "golden" qualities that you have disowned and projected onto others. This often manifests as intense admiration, envy, or idealization of people who express traits you haven\'t owned in yourself.', importance: 6 },
    { id: 'dark-shadow', label: 'Dark Shadow', category: 'shadow', description: 'The negative or "dark" qualities that you have repressed and disowned. These are the traits you judge harshly in yourself and others, and they often surface as intense irritation, anger, or moral indignation.', importance: 6 },
    { id: 'voice-dialogue', label: 'Voice Dialogue', category: 'shadow', description: 'A therapeutic technique that involves speaking directly to and from various sub-personalities or "parts" within you. This allows you to understand the role, function, and needs of each part from its own perspective.', importance: 6 },
    { id: 'journaling', label: 'Shadow Journaling', category: 'shadow', description: 'Using writing as a tool to explore unconscious material without judgment. Free-writing with specific prompts can help externalize shadow content, making it visible and easier to work with consciously.', importance: 7 },
    { id: 'triggers', label: 'Triggers', category: 'shadow', description: 'Intense emotional reactions to a person or situation that are disproportionate to the actual event. These triggers are valuable signals, pointing directly to an unexamined wound or a disowned part of your shadow that needs attention.', importance: 7 },
    { id: 'integration', label: 'Shadow Integration', category: 'shadow', description: 'The process of making the unconscious conscious and re-owning disowned parts of yourself. Integration doesn\'t mean acting out negative traits, but rather acknowledging their presence and wisdom, which frees up vital energy.', importance: 8 },
    { id: 'defense-mechanisms', label: 'Defense Mechanisms', category: 'shadow', description: 'Unconscious psychological strategies used to cope with anxiety and protect a fragile ego. Common mechanisms include projection, denial, and repression, all of which keep shadow material out of awareness.', importance: 6 },
    { id: 'repression', label: 'Repression', category: 'shadow', description: 'The psychological defense mechanism of involuntarily pushing unwanted thoughts, feelings, or memories into the unconscious. While protective, it consumes significant psychic energy and keeps parts of the self disowned.', importance: 6 },
    { id: 'dreams', label: 'Dream Work', category: 'shadow', description: 'The practice of analyzing dreams to gain insight into the unconscious. Dreams often speak in a symbolic language, revealing disowned parts, unresolved conflicts, and hidden wisdom from the shadow.', importance: 5 },
    { id: 'inner-critic', label: 'Inner Critic', category: 'shadow', description: 'A harsh internal voice that judges, shames, and attacks you. This is often a "manager" part (in IFS terms) that is trying to protect you by preventing you from making mistakes or being judged by others.', importance: 7 },
    { id: 'self-compassion', label: 'Self-Compassion', category: 'shadow', description: 'The practice of treating yourself with the same kindness and understanding you would offer a good friend when you fail or suffer. It is a powerful antidote to the shame and self-judgment fueled by the inner critic.', importance: 8 },
    { id: 'authentic-self', label: 'Authentic Self', category: 'shadow', description: 'The true, genuine you that exists beneath the layers of social conditioning, defense mechanisms, and disowned shadow parts. Shadow work is the process of clearing what obscures this authentic Self.', importance: 7 },
    { id: 'shame', label: 'Shame', category: 'shadow', description: 'The intensely painful feeling or experience of believing that we are flawed and therefore unworthy of love and belonging. It is a core emotion often held in the shadow by exiled parts.', importance: 7 },
    { id: 'vulnerability', label: 'Vulnerability', category: 'shadow', description: 'The state of emotional exposure that comes with uncertainty and risk. Embracing vulnerability is essential for connection and is often a prerequisite for doing meaningful shadow work and healing shame.', importance: 7 },
    { id: 'blind-spots', label: 'Blind Spots', category: 'shadow', description: 'Aspects of our own personality and behavior that are obvious to others but completely invisible to us. These are often part of our shadow, and feedback from trusted others is a key way to discover them.', importance: 6 },
    { id: 'wholeness', label: 'Wholeness', category: 'shadow', description: 'The state of being that emerges from integrating all aspects of yourself—light and dark, masculine and feminine, strengths and weaknesses. It is the ultimate goal of shadow work and the path to true authenticity.', importance: 7 },
    // NEW NODES
    // Spirit
    { id: 'shamatha', label: 'Shamatha', category: 'spirit', description: 'A type of meditation focused on calming the mind and developing sustained, single-pointed concentration. It is the foundational practice for stabilizing attention, creating a mental platform from which deeper insight can arise.', importance: 7 },
    { id: 'vipassana', label: 'Vipassana', category: 'spirit', description: 'A form of insight meditation that involves observing reality as it truly is, without judgment or attachment. It cultivates wisdom by directly perceiving the impermanent, unsatisfactory, and selfless nature of all phenomena.', importance: 7 },
    { id: 'metta', label: 'Metta', category: 'spirit', description: 'The Pali word for loving-kindness. Metta meditation is the specific practice of cultivating unconditional goodwill for oneself, for loved ones, and ultimately for all beings, which serves as a powerful antidote to anger and fear.', importance: 7 },
    { id: 'mantra', label: 'Mantra', category: 'spirit', description: 'The practice of repeating a sacred sound, word, or phrase to focus the mind and invoke a particular state of consciousness. It can be a powerful tool for concentration, devotion, and energetic transformation.', importance: 6 },
    // Body
    { id: 'pranayama', label: 'Pranayama', category: 'body', description: 'Yogic breath-control techniques designed to direct and expand prana, or life-force energy, in the subtle body. These practices can be used to energize, calm, or balance the entire nervous system.', importance: 7 },
    { id: 'microcosmic-orbit', label: 'Microcosmic Orbit', category: 'body', description: 'An advanced Taoist Qigong practice that involves circulating chi (life force) up the spine and down the front of the torso. This meditation is said to harmonize energies and promote profound health and vitality.', importance: 5 },
    // Shadow
    { id: 'memory-reconsolidation', label: 'Memory Reconsolidation', category: 'shadow', description: 'The neurological process by which old emotional learnings can be updated. Therapeutic techniques that create a "mismatch experience" can permanently rewrite the implicit emotional grammar underlying long-standing issues, effectively healing trauma.', importance: 8 },
    { id: 'maladaptive-schemas', label: 'Maladaptive Schemas', category: 'shadow', description: 'Pervasive, self-defeating life patterns or themes that we developed in childhood (from Schema Therapy). These core beliefs, like "Abandonment" or "Defectiveness," operate unconsciously, shaping our feelings, thoughts, and behaviors throughout life.', importance: 7 }
  ],
  links: [
    // Core structure
    { source: 'ilp', target: 'body-module' },
    { source: 'ilp', target: 'mind-module' },
    { source: 'ilp', target: 'spirit-module' },
    { source: 'ilp', target: 'shadow-module' },
    
    // Body Module
    { source: 'body-module', target: 'sleep' },
    { source: 'body-module', target: 'resistance-training' },
    { source: 'body-module', target: 'zone2-cardio' },
    { source: 'body-module', target: 'nutrition' },
    { source: 'body-module', target: '3-body-workout' },
    { source: '3-body-workout', target: 'physical-body' },
    { source: '3-body-workout', target: 'subtle-body' },
    { source: '3-body-workout', target: 'causal-body' },
    { source: 'physical-body', target: 'resistance-training' },
    { source: 'physical-body', target: 'zone2-cardio' },
    { source: 'physical-body', target: 'mobility' },
    { source: 'subtle-body', target: 'yoga' },
    { source: 'subtle-body', target: 'tai-chi' },
    { source: 'subtle-body', target: 'qigong' },
    { source: 'subtle-body', target: 'breathwork' },
    { source: 'causal-body', target: 'meditation' },
    { source: 'sleep', target: 'circadian' },
    { source: 'sleep', target: 'recovery' },
    { source: 'zone2-cardio', target: 'mitochondria' },
    { source: 'zone2-cardio', target: 'hrv' },
    { source: 'breathwork', target: 'nervous-system' },
    { source: 'breathwork', target: 'hrv' },
    { source: 'nutrition', target: 'protein' },
    { source: 'nutrition', target: 'micronutrients' },
    { source: 'nutrition', target: 'hydration' },
    { source: 'resistance-training', target: 'hormones' },
    { source: 'cold-exposure', target: 'hormones' },
    { source: 'heat-exposure', target: 'hrv' },
    { source: 'mobility', target: 'posture' },
    
    // Mind Module
    { source: 'mind-module', target: 'vertical' },
    { source: 'mind-module', target: 'horizontal' },
    { source: 'vertical', target: 'kegan' },
    { source: 'vertical', target: 'spiral-dynamics' },
    { source: 'kegan', target: 'subject-object' },
    { source: 'kegan', target: 'order3' },
    { source: 'kegan', target: 'order4' },
    { source: 'kegan', target: 'order5' },
    { source: 'order3', target: 'order4' },
    { source: 'order4', target: 'order5' },
    { source: 'spiral-dynamics', target: 'blue' },
    { source: 'spiral-dynamics', target: 'orange' },
    { source: 'spiral-dynamics', target: 'green' },
    { source: 'spiral-dynamics', target: 'yellow' },
    { source: 'spiral-dynamics', target: 'second-tier' },
    { source: 'blue', target: 'orange' },
    { source: 'orange', target: 'green' },
    { source: 'green', target: 'yellow' },
    { source: 'yellow', target: 'second-tier' },
    { source: 'order4', target: 'orange' },
    { source: 'order5', target: 'yellow' },
    { source: 'horizontal', target: 'enneagram' },
    { source: 'horizontal', target: 'ifs' },
    { source: 'ifs', target: 'self' },
    { source: 'ifs', target: 'parts' },
    { source: 'parts', target: 'managers' },
    { source: 'parts', target: 'exiles' },
    { source: 'mind-module', target: 'mental-models' },
    { source: 'mind-module', target: 'systems-thinking' },
    { source: 'mind-module', target: 'metacognition' },
    { source: 'mental-models', target: 'cognitive-biases' },
    { source: 'mental-models', target: 'polarity' },
    { source: 'systems-thinking', target: 'polarity' },
    { source: 'metacognition', target: 'cognitive-biases' },
    { source: 'perspective-taking', target: 'second-tier' },
    
    // Spirit Module
    { source: 'spirit-module', target: 'meditation' },
    { source: 'spirit-module', target: 'gratitude' },
    { source: 'spirit-module', target: 'nature-exposure' },
    { source: 'meditation', target: 'mindfulness' },
    { source: 'meditation', target: 'witness' },
    { source: 'meditation', target: 'attention' },
    { source: 'meditation', target: 'mbsr' },
    { source: 'mindfulness', target: 'presence' },
    { source: 'mindfulness', target: 'equanimity' },
    { source: 'meditation', target: 'loving-kindness' },
    { source: 'loving-kindness', target: 'compassion' },
    { source: 'gratitude', target: 'meaning' },
    { source: 'prayer', target: '2nd-person' },
    { source: 'contemplation', target: '3rd-person' },
    { source: 'meditation', target: '1st-person' },
    { source: 'big-mind', target: '1st-person' },
    { source: 'witness', target: '1st-person' },
    { source: 'meditation', target: 'states' },
    { source: 'states', target: 'stages' },
    { source: 'nature-exposure', target: 'awe' },
    { source: 'awe', target: 'transcendence' },
    { source: 'devotion', target: 'prayer' },
    { source: 'service', target: 'compassion' },
    { source: 'retreat', target: 'meditation' },
    
    // Shadow Module
    { source: 'shadow-module', target: 'shadow-work' },
    { source: 'shadow-module', target: '3-2-1-process' },
    { source: 'shadow-work', target: 'projection' },
    { source: 'shadow-work', target: 'integration' },
    { source: 'projection', target: 'disowned-self' },
    { source: 'disowned-self', target: 'golden-shadow' },
    { source: 'disowned-self', target: 'dark-shadow' },
    { source: '3-2-1-process', target: 'projection' },
    { source: 'shadow-work', target: 'voice-dialogue' },
    { source: 'shadow-work', target: 'journaling' },
    { source: 'triggers', target: 'projection' },
    { source: 'triggers', target: 'defense-mechanisms' },
    { source: 'defense-mechanisms', target: 'repression' },
    { source: 'journaling', target: 'dreams' },
    { source: 'inner-critic', target: 'parts' },
    { source: 'self-compassion', target: 'inner-critic' },
    { source: 'integration', target: 'wholeness' },
    { source: 'authentic-self', target: 'wholeness' },
    { source: 'shame', target: 'self-compassion' },
    { source: 'vulnerability', target: 'authentic-self' },
    { source: 'blind-spots', target: 'projection' },
    
    // Cross-module integrations
    { source: 'sleep', target: 'metacognition' },
    { source: 'nervous-system', target: 'equanimity' },
    { source: 'breathwork', target: 'meditation' },
    { source: 'yoga', target: 'meditation' },
    { source: 'tai-chi', target: 'mindfulness' },
    { source: 'zone2-cardio', target: 'nature-exposure' },
    { source: 'breathwork', target: 'triggers' },
    { source: 'witness', target: 'metacognition' },
    { source: 'meditation', target: 'order5' },
    { source: 'perspective-taking', target: 'compassion' },
    { source: 'subject-object', target: 'shadow-work' },
    { source: 'parts', target: 'disowned-self' },
    { source: 'enneagram', target: 'blind-spots' },
    { source: 'meditation', target: 'integration' },
    { source: 'compassion', target: 'self-compassion' },
    { source: 'witness', target: 'projection' },
    { source: 'wholeness', target: 'ilp' },
    { source: 'equanimity', target: 'integration' },
    { source: 'presence', target: 'authentic-self' },
    // NEW LINKS
    // Spirit
    { source: 'meditation', target: 'shamatha' },
    { source: 'attention', target: 'shamatha' },
    { source: 'meditation', target: 'vipassana' },
    { source: 'mindfulness', target: 'vipassana' },
    { source: 'loving-kindness', target: 'metta' },
    { source: 'compassion', target: 'metta' },
    { source: 'contemplation', target: 'meaning' },
    { source: 'meditation', target: 'mantra' },
    { source: 'devotion', target: 'mantra' },
    // Body
    { source: 'breathwork', target: 'pranayama' },
    { source: 'yoga', target: 'pranayama' },
    { source: 'qigong', target: 'microcosmic-orbit' },
    { source: 'subtle-body', target: 'microcosmic-orbit' },
    // Shadow (corrected from misplaced nodes)
    { source: 'shadow-work', target: 'memory-reconsolidation' },
    { source: 'shadow-work', target: 'maladaptive-schemas' },
    { source: 'maladaptive-schemas', target: 'repression' },
    { source: 'memory-reconsolidation', target: 'shame' },
    { source: 'memory-reconsolidation', target: 'triggers' }
  ]
};

// Interactive Diagram Definitions
const diagramGroups = [
    { parentId: '3-body-workout', childIds: ['physical-body', 'subtle-body', 'causal-body'], type: 'three-bodies' },
    { parentId: 'kegan', childIds: ['order3', 'order4', 'order5'], type: 'kegan-orders' },
];

const categoryColors: Record<string, string> = {
  'core': '#ec4899', // Pink
  'body': '#10b981', // Emerald
  'mind': '#3b82f6', // Blue
  'spirit': '#8b5cf6', // Violet
  'shadow': '#f59e0b' // Amber
};

// FIX: Use Selection type from modular import.
const createGlowAndGradients = (svg: Selection<SVGSVGElement, unknown, null, undefined>, categoryColors: Record<string, string>) => {
    const defs = svg.append('defs');
  
    Object.entries(categoryColors).forEach(([category, color]) => {
      const filter = defs.append('filter')
        .attr('id', `glow-${category}`)
        .attr('width', '300%')
        .attr('height', '300%')
        .attr('x', '-100%')
        .attr('y', '-100%');
  
      filter.append('feGaussianBlur')
        .attr('stdDeviation', '4') 
        .attr('result', 'coloredBlur');
  
      const feMerge = filter.append('feMerge');
      feMerge.append('feMergeNode').attr('in', 'coloredBlur');
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    });
  
    Object.entries(categoryColors).forEach(([category, color]) => {
      const gradient = defs.append('radialGradient')
        .attr('id', `gradient-${category}`);
  
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', color)
        .attr('stop-opacity', 1);
  
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', color)
        .attr('stop-opacity', 0.6);
    });
};

function forceCluster() {
    let nodes: any[] = [];
    let strength = 0.1;
  
    function force(alpha: number) {
      const clusters: any = {};
  
      nodes.forEach(d => {
        if (!clusters[d.category] || d.importance > (clusters[d.category] ? clusters[d.category].importance : -1)) {
          clusters[d.category] = d;
        }
      });
  
      nodes.forEach(d => {
        const cluster = clusters[d.category];
        if (cluster && cluster !== d) {
          const k = strength * alpha;
          d.vx -= (d.x - cluster.x) * k;
          d.vy -= (d.y - cluster.y) * k;
        }
      });
    }
  
    force.initialize = (_: any[]) => nodes = _;
    force.strength = (_?: number): any => { strength = _ !== undefined ? _ : strength; return force; };
  
    return force;
}

const findPath = (startId: string, endId: string) => {
    const adj: any = {};
    graphData.nodes.forEach(node => adj[node.id] = []);
    graphData.links.forEach(link => {
        const sourceId = (link.source as any).id || link.source;
        const targetId = (link.target as any).id || link.target;
        adj[sourceId].push(targetId);
        adj[targetId].push(sourceId);
    });

    const queue = [[startId]];
    const visited = new Set([startId]);

    while (queue.length > 0) {
        const path = queue.shift()!;
        const node = path[path.length - 1];

        if (node === endId) return path;

        for (const neighbor of adj[node]) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                const newPath = [...path, neighbor];
                queue.push(newPath);
            }
        }
    }
    return null; // No path found
};

const styles = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  .important-node {
    animation: pulse 2.5s infinite ease-in-out;
    transform-origin: center center;
  }
`;

const ILPKnowledgeGraph = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [tooltip, setTooltip] = useState<any>({ show: false, x: 0, y: 0, data: null });
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [layoutType, setLayoutType] = useState<'force' | 'hierarchical'>('force'); 
  const [startNodeId, setStartNodeId] = useState<string | null>(null);
  const [endNodeId, setEndNodeId] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [pathMode, setPathMode] = useState(false);
  const [expandedDiagrams, setExpandedDiagrams] = useState<Record<string, boolean>>({});

  const resetPath = () => {
    setStartNodeId(null);
    setEndNodeId(null);
    setSelectedPath([]);
    setPathMode(false);
  };
  
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = (containerRef.current as HTMLDivElement).clientWidth;
    const height = (containerRef.current as HTMLDivElement).clientHeight;
    if (width === 0 || height === 0) return;

    // FIX: Use select function from modular import.
    select(svgRef.current).selectAll('*').remove();
    
    // FIX: Use select function from modular import.
    const svg = select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .on('click', (event) => {
        if (event.target === svg.node()) {
          setSelectedNode(null);
          if (!pathMode) resetPath(); 
        }
      });

    createGlowAndGradients(svg, categoryColors);

    const g = svg.append('g');
    const diagramChildIds = new Set(diagramGroups.flatMap(g => g.childIds));
    const diagramParentIds = new Set(diagramGroups.map(g => g.parentId));

    // FIX: Use zoom function from modular import.
    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior as any);
    // FIX: Use zoomIdentity function from modular import.
    svg.call(zoomBehavior.transform as any, zoomIdentity.translate(width / 2, height / 2).scale(0.3).translate(-width/2, -height/2));

    // FIX: Use forceSimulation function from modular import.
    const simulation = forceSimulation(graphData.nodes as any)
      // FIX: Use forceLink function from modular import.
      .force('link', forceLink(graphData.links).id((d: any) => d.id).distance(100).strength(0.5))
      // FIX: Use forceManyBody function from modular import.
      .force('charge', forceManyBody().strength(-400))
      // FIX: Use forceCenter function from modular import.
      .force('center', forceCenter(width / 2, height / 2))
      // FIX: Use forceCollide function from modular import.
      .force('collision', forceCollide().radius((d: any) => 25 + d.importance * 2))
      .force('cluster', forceCluster().strength(0.2));

    const link = g.append('g').selectAll('path').data(graphData.links).join('path').attr('fill', 'none');
    const node = g.append('g').selectAll('circle').data(graphData.nodes).join('circle');
    const label = g.append('g').selectAll('text').data(graphData.nodes).join('text');
    const diagramOverlays = g.append('g').attr('class', 'diagram-overlay-layer');

    const handleNodeClick = (event: any, d: any) => {
        event.stopPropagation();
        if (diagramParentIds.has(d.id)) {
            setExpandedDiagrams(prev => ({ ...prev, [d.id]: !prev[d.id] }));
            return;
        }
        if (pathMode) {
            if (!startNodeId) { setStartNodeId(d.id); setEndNodeId(null); setSelectedPath([]); }
            else if (!endNodeId) {
                if (d.id === startNodeId) { resetPath(); } 
                else { setEndNodeId(d.id); const path = findPath(startNodeId, d.id); setSelectedPath(path || []); }
            } else { setStartNodeId(d.id); setEndNodeId(null); setSelectedPath([]); }
        } else {
            setSelectedNode((prev: any) => (prev?.id === d.id ? null : d));
        }
    };

    node
      .attr('r', (d: any) => 6 + d.importance * 1.2)
      .attr('fill', (d: any) => `url(#gradient-${d.category})`)
      .style('cursor', 'pointer')
      .style('visibility', (d:any) => diagramChildIds.has(d.id) ? 'hidden' : 'visible')
      .attr('filter', (d: any) => d.importance >= 8 ? `url(#glow-${d.category})` : null)
      .classed('important-node', (d: any) => d.importance >= 8)
      .on('click', handleNodeClick)
      // FIX: Use drag function from modular import.
      .call(drag<SVGCircleElement, any>()
        .on('start', (event, d: any) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag', (event, d: any) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d: any) => { if (!event.active) simulation.alphaTarget(0); if (layoutType === 'force') { d.fx = null; d.fy = null; } }) as any)
      .on('mouseenter', (event, d: any) => {
        if (!selectedNode && !pathMode && !diagramParentIds.has(d.id) && !diagramChildIds.has(d.id)) { 
          const connectedLinks = graphData.links.filter((l: any) => (l.source as any).id === d.id || (l.target as any).id === d.id);
          const connectedNodes = new Set<string>();
          connectedLinks.forEach((l: any) => { connectedNodes.add((l.source as any).id); connectedNodes.add((l.target as any).id); });
          setTooltip({ show: true, x: event.pageX, y: event.pageY, data: { ...d, connections: connectedNodes.size -1 } });
        }
      })
      .on('mouseleave', () => setTooltip({ show: false, x: 0, y: 0, data: null }));

    label
      .attr('dx', (d: any) => 10 + d.importance)
      .attr('dy', 4)
      .attr('font-size', (d: any) => d.importance > 8 ? '13px' : '11px')
      .attr('font-weight', (d: any) => d.importance > 8 ? 600 : 500)
      .attr('fill', '#e2e8f0')
      .style('pointer-events', 'none')
      .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.9)')
      .style('visibility', (d:any) => diagramChildIds.has(d.id) ? 'hidden' : 'visible')
      .text((d: any) => d.label);
    
    // Interactive Diagrams Logic
    const diagramGroupsSelection = diagramOverlays.selectAll('g.diagram-group').data(diagramGroups, (d:any) => d.parentId).join('g').attr('class', 'diagram-group');

    const pathSet = new Set(selectedPath);
    let neighbors: Set<string> = new Set();
    if (selectedNode && !pathMode) {
      neighbors.add(selectedNode.id);
      graphData.links.forEach((link: any) => {
        const sourceId = (link.source as any).id || link.source;
        const targetId = (link.target as any).id || link.target;
        if (sourceId === selectedNode.id) neighbors.add(targetId);
        else if (targetId === selectedNode.id) neighbors.add(sourceId);
      });
    }
    
    node
      .attr('stroke', (d: any) => {
        if (diagramParentIds.has(d.id)) return expandedDiagrams[d.id] ? '#fde047' : categoryColors[d.category];
        if (pathMode) {
            if (d.id === startNodeId) return '#67e8f9';
            if (d.id === endNodeId) return '#a78bfa';
        }
        return selectedNode?.id === d.id ? '#fde047' : '#1e293b';
      })
      .attr('stroke-width', (d: any) => diagramParentIds.has(d.id) ? 4 : (selectedNode?.id === d.id || d.id === startNodeId || d.id === endNodeId) ? 4 : 2)
      .style('opacity', (d: any) => {
        if (selectedPath.length > 0) return pathSet.has(d.id) ? 1 : 0.1;
        if (selectedNode) return neighbors.has(d.id) ? 1 : 0.1; 
        const categoryMatch = currentFilter === 'all' || d.category === currentFilter;
        const searchMatch = searchTerm === '' || d.label.toLowerCase().includes(searchTerm.toLowerCase()) || d.description.toLowerCase().includes(searchTerm.toLowerCase());
        return (categoryMatch && searchMatch) ? 1 : 0.1;
    });

    link.attr('stroke-width', (d: any) => {
        const sourceId = (d.source as any).id; const targetId = (d.target as any).id;
        if (selectedPath.length > 0) {
            const index1 = selectedPath.indexOf(sourceId);
            const index2 = selectedPath.indexOf(targetId);
            if (Math.abs(index1 - index2) === 1) return 4;
        }
        const importance = ((d.source as any).importance + (d.target as any).importance) / 2;
        return Math.max(1, importance / 4);
    })
    .attr('stroke', (d: any) => {
        const sourceId = (d.source as any).id; const targetId = (d.target as any).id;
        if (selectedPath.length > 0) {
            const index1 = selectedPath.indexOf(sourceId);
            const index2 = selectedPath.indexOf(targetId);
            if (index1 > -1 && index2 > -1 && Math.abs(index1-index2) === 1) return '#fde047';
        }
        if (selectedNode && ((sourceId === selectedNode.id && neighbors.has(targetId)) || (targetId === selectedNode.id && neighbors.has(sourceId)))) return '#94a3b8';
        return '#334155';
    })
    .attr('stroke-opacity', (d: any) => {
        const sourceId = (d.source as any).id; const targetId = (d.target as any).id;
        if (diagramChildIds.has(sourceId) || diagramChildIds.has(targetId)) return 0.05;
        if (selectedPath.length > 0) {
            const index1 = selectedPath.indexOf(sourceId);
            const index2 = selectedPath.indexOf(targetId);
            return (index1 > -1 && index2 > -1 && Math.abs(index1-index2) === 1) ? 1 : 0.05;
        }
        if (selectedNode) return ((sourceId === selectedNode.id && neighbors.has(targetId)) || (targetId === selectedNode.id && neighbors.has(sourceId))) ? 0.9 : 0.05;
        const sourceMatch = currentFilter === 'all' || (d.source as any).category === currentFilter;
        const targetMatch = currentFilter === 'all' || (d.target as any).category === currentFilter;
        return (sourceMatch && targetMatch) ? 0.4 : 0.05;
    });

    label.style('opacity', (d: any) => {
        if (selectedPath.length > 0) return pathSet.has(d.id) ? 1 : 0.1;
        if (selectedNode) return neighbors.has(d.id) ? 1 : 0.1;
        const categoryMatch = currentFilter === 'all' || d.category === currentFilter;
        const searchMatch = searchTerm === '' || d.label.toLowerCase().includes(searchTerm.toLowerCase()) || d.description.toLowerCase().includes(searchTerm.toLowerCase());
        return (categoryMatch && searchMatch) ? 1 : 0.1;
    });

    if (layoutType === 'force') {
        graphData.nodes.forEach((node: any) => { node.fx = null; node.fy = null; });
        simulation.alpha(0.3).restart();
    } else {
        const modulePositions: any = {
            'ilp': { x: width / 2, y: 100 },
            'body-module': { x: width / 5, y: 350 },
            'mind-module': { x: 2 * width / 5, y: 350 },
            'spirit-module': { x: 3 * width / 5, y: 350 },
            'shadow-module': { x: 4 * width / 5, y: 350 }
        };
        graphData.nodes.forEach((node: any) => {
            if (modulePositions[node.id]) {
                node.fx = modulePositions[node.id].x;
                node.fy = modulePositions[node.id].y;
            } else if (node.category !== 'core') {
                const moduleNodeId = `${node.category}-module`;
                if (modulePositions[moduleNodeId]) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 100 + Math.random() * 150;
                    node.fx = modulePositions[moduleNodeId].x + Math.cos(angle) * radius;
                    node.fy = modulePositions[moduleNodeId].y + Math.sin(angle) * radius;
                }
            }
        });
        simulation.alpha(0.3).restart();
    }

    simulation.on('tick', () => {
      link.attr('d', (d: any) => `M${d.source.x},${d.source.y} Q${(d.source.x + d.target.x) / 2 + (d.target.y - d.source.y)/4},${(d.source.y + d.target.y) / 2 - (d.target.x - d.source.x)/4} ${d.target.x},${d.target.y}`);
      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
      label.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
      
      diagramGroupsSelection.each(function(d) {
        // FIX: Use select function from modular import.
        const group = select(this);
        const parentNode = graphData.nodes.find(n => n.id === d.parentId) as any;
        if (!parentNode) return;
        group.attr('transform', `translate(${parentNode.x}, ${parentNode.y})`);
        
        const isExpanded = !!expandedDiagrams[d.parentId];
        
        if (d.type === 'kegan-orders') {
            const childNodes = d.childIds.map((id:string) => graphData.nodes.find(n => n.id === id));
            
            const rects = group.selectAll('rect').data(childNodes, (cn:any) => cn.id)
                .join(
                    enter => enter.append('rect').attr('x', -60).attr('width', 120).attr('height', 0).attr('y', 0).attr('rx', 4),
                    update => update,
                    exit => exit.transition().duration(300).attr('height', 0).attr('y', 0).remove()
                )
                .attr('fill', (cn:any) => categoryColors[cn.category]).attr('fill-opacity', 0.5)
                .attr('stroke', (cn:any) => categoryColors[cn.category]).attr('stroke-width', 2);
            
            rects.transition().duration(500).attr('y', (cn, i) => isExpanded ? 30 * (i + 1) : 0).attr('height', isExpanded ? 25 : 0);
            
            const texts = group.selectAll('text').data(childNodes, (cn:any) => cn.id)
                .join('text').attr('x', 0).attr('text-anchor', 'middle').attr('fill', 'white').attr('font-size', '10px').style('pointer-events', 'none')
                .text((cn:any) => cn.label);
            
            texts.transition().duration(500).attr('y', (cn, i) => isExpanded ? 30 * (i + 1) + 17 : 10).style('opacity', isExpanded ? 1 : 0);
        }

        if (d.type === 'three-bodies') {
            const childNodes = d.childIds.slice().reverse().map((id:string) => graphData.nodes.find(n => n.id === id)); // Reverse for drawing order
            
            const circles = group.selectAll('circle').data(childNodes, (cn:any) => cn.id)
                .join(
                    enter => enter.append('circle').attr('r', 0),
                    update => update,
                    exit => exit.transition().duration(300).attr('r', 0).remove()
                )
                .attr('fill', (cn:any) => categoryColors[cn.category]).attr('fill-opacity', 0.2)
                .attr('stroke', (cn:any) => categoryColors[cn.category]).attr('stroke-width', 2);

            circles.transition().duration(500).attr('r', (cn, i) => isExpanded ? 60 - i * 20 : 0);

            const texts = group.selectAll('text').data(childNodes, (cn:any) => cn.id)
                .join('text').attr('text-anchor', 'middle').attr('fill', 'white').attr('font-size', '10px').style('pointer-events', 'none')
                .text((cn:any) => cn.label);
            
            texts.transition().duration(500).attr('y', (cn, i) => isExpanded ? -(40 - i * 20) : 0).style('opacity', isExpanded ? 1 : 0);
        }
      });
    });

  }, [currentFilter, searchTerm, selectedNode, layoutType, startNodeId, endNodeId, selectedPath, pathMode, expandedDiagrams]);

  const directConnections = selectedNode ? graphData.links
    .filter((l: any) => (l.source as any).id === selectedNode.id || (l.target as any).id === selectedNode.id)
    .map((l: any) => {
        const neighborId = (l.source as any).id === selectedNode.id ? (l.target as any).id : (l.source as any).id;
        return graphData.nodes.find(n => n.id === neighborId);
    }).filter(Boolean) : [];

  return (
    <div ref={containerRef} style={{ 
      width: '100%', 
      height: '80vh', 
      background: '#0f172a',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '12px',
      border: '1px solid #334155'
    }}>
      <style>{styles}</style>
      <div className="absolute top-5 left-5 bg-slate-900/80 backdrop-blur-md p-4 rounded-lg border border-slate-700 z-10 space-y-3 max-w-xs">
          <input type="text" placeholder="Search concepts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-slate-600 rounded-md bg-slate-800 text-slate-200 text-sm"/>
          <div className="space-y-1">
            {['all', 'body', 'mind', 'spirit', 'shadow'].map(cat => (
              <button key={cat} onClick={() => setCurrentFilter(cat)} 
                className={`w-full text-left p-2 rounded text-sm transition-colors ${currentFilter === cat ? 'bg-purple-600 text-white font-semibold' : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'}`}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-700 space-y-2">
            <button onClick={() => {
              setLayoutType(t => t === 'force' ? 'hierarchical' : 'force');
              setSelectedNode(null);
              resetPath();
            }} 
              className="w-full flex items-center justify-center gap-2 p-2 rounded text-sm bg-slate-700/50 hover:bg-slate-700 text-slate-300">
              {layoutType === 'force' ? <Shuffle size={14}/> : <MapPin size={14}/>}
              <span>{layoutType === 'force' ? 'Dynamic Layout' : 'Static Layout'}</span>
            </button>
            <button onClick={() => { 
                setPathMode(!pathMode); 
                resetPath(); 
                setSelectedNode(null);
              }}
              className={`w-full flex items-center justify-center gap-2 p-2 rounded text-sm transition-colors ${pathMode ? 'bg-yellow-500 text-black font-semibold' : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300'}`}>
              <LinkIcon size={14}/>
              <span>{pathMode ? 'Exit Path Mode' : 'Find Path'}</span>
            </button>
            {pathMode && (
                <div className="text-xs text-slate-400 p-2 bg-slate-800 rounded">
                    <p><strong>1. Click start node</strong> {startNodeId && <span className="text-cyan-400">(Selected: {graphData.nodes.find(n => n.id === startNodeId)?.label})</span>}</p>
                    <p><strong>2. Click end node</strong> {endNodeId && <span className="text-purple-400">(Selected: {graphData.nodes.find(n => n.id === endNodeId)?.label})</span>}</p>
                    {selectedPath.length > 0 && <p className="text-yellow-400 mt-1">Path found! ({selectedPath.length - 1} steps)</p>}
                    <button onClick={resetPath} className="text-red-400 hover:underline mt-1">Reset Path</button>
                </div>
            )}
          </div>
      </div>

      <div className="absolute bottom-5 left-5 bg-slate-900/80 backdrop-blur-md p-3 rounded-lg border border-slate-700 z-10">
        {Object.entries(categoryColors).map(([key, color]) => (
          <div key={key} className="flex items-center my-1">
            <div className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: color as string}}></div>
            <span className="text-xs text-slate-400">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
          </div>
        ))}
      </div>

      {tooltip.show && tooltip.data && !selectedNode && (
        <div style={{
          position: 'fixed', left: tooltip.x + 15, top: tooltip.y + 15, background: 'rgba(15, 23, 42, 0.98)',
          color: '#e2e8f0', padding: '15px', borderRadius: '8px', fontSize: '13px', maxWidth: '350px',
          zIndex: 2000, border: '1px solid rgba(99, 102, 241, 0.5)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)', pointerEvents: 'none'
        }}>
          <h3 style={{ color: categoryColors[tooltip.data.category], marginBottom: '8px', fontSize: '16px' }}>{tooltip.data.label}</h3>
          <div className="text-slate-300 leading-relaxed mb-2">{tooltip.data.description}</div>
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">Connections: {tooltip.data.connections} | Importance: {tooltip.data.importance}/10</div>
        </div>
      )}

      <svg ref={svgRef} />

      <div className={`absolute top-0 right-0 w-96 h-full bg-slate-900/80 backdrop-blur-md border-l border-slate-700 z-20 transition-transform duration-300 ease-in-out ${selectedNode ? 'translate-x-0' : 'translate-x-full'}`}>
          {selectedNode && (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
                  <h2 className="text-xl font-bold" style={{color: categoryColors[selectedNode.category]}}>{selectedNode.label}</h2>
                  <button onClick={() => setSelectedNode(null)} className="text-slate-500 hover:text-white"><X size={24}/></button>
                </div>
                <div className="p-4 overflow-y-auto space-y-4">
                    <p className="text-sm text-slate-300">{selectedNode.description}</p>
                    <div className="text-sm grid grid-cols-2 gap-2">
                       <div className="bg-slate-800 p-2 rounded-md">
                            <p className="text-xs text-slate-400">Module</p>
                            <p className="font-semibold" style={{color: categoryColors[selectedNode.category]}}>{selectedNode.category.charAt(0).toUpperCase() + selectedNode.category.slice(1)}</p>
                       </div>
                       <div className="bg-slate-800 p-2 rounded-md">
                            <p className="text-xs text-slate-400">Importance</p>
                            <p className="font-semibold">{selectedNode.importance}/10</p>
                       </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-200 mb-2 flex items-center gap-2"><LinkIcon size={16}/> Connections ({directConnections.length})</h3>
                        <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
                            {directConnections.map((node: any) => (
                                <button key={node.id} onClick={() => setSelectedNode(node)} className="w-full text-left p-2 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: categoryColors[node.category]}}></div>
                                    <span className="text-sm text-slate-300">{node.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
              </div>
          )}
      </div>

    </div>
  );
};

export default ILPKnowledgeGraph;