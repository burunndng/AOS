
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { drag } from 'd3-drag';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import { select, Selection, BaseType } from 'd3-selection';
import { zoom, zoomIdentity, ZoomBehavior } from 'd3-zoom';
import { transition } from 'd3-transition';
import type * as d3 from 'd3'; // FIX: Added type-only import for d3 namespace
import { X } from 'lucide-react';

interface Node {
  id: string;
  label: string;
  category: string;
  description: string;
  importance: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: string | Node;
  target: string | Node;
  value: number;
}

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
    { id: 'causal-body', label: 'Causal Body', category: 'body', description: 'The dimension of pure, formless awareness and spaciousness. This is the source accessed through deep meditation, which serves as the foundation for peace and rest.', importance: 6 },
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
    { id: 'service', label: 'Selfless Service', category: 'spirit', description: 'The practice of acting for the benefit of others without expecting personal reward. It purifies the ego by shifting focus from "what\'s in it for me?" to "how can I help?", cultivating compassion and interconnectedness.', importance: 5 },
    
    // ========== SHADOW MODULE (15) ==========
    { id: '3-2-1', label: '3-2-1 Process', category: 'shadow', description: 'A core ILP practice for integrating projections. It involves facing, talking to, and then becoming a person or quality that triggers you, in order to reclaim that disowned energy as part of yourself.', importance: 9 },
    { id: 'shadow-journaling', label: 'Shadow Journaling', category: 'shadow', description: 'Using specific, targeted prompts to explore your unconscious patterns, hidden beliefs, and internal conflicts. It externalizes shadow material so it can be examined with curiosity rather than judgment.', importance: 7 },
    { id: 'self-compassion-break', label: 'Self-Compassion Break', category: 'shadow', description: 'A brief, in-the-moment practice to counter self-criticism and shame. It involves mindfully acknowledging your suffering, recognizing it as part of the shared human experience, and offering yourself kindness.', importance: 8 },
    { id: 'parts-dialogue', label: 'Parts Dialogue', category: 'shadow', description: 'A technique, central to the IFS model, for communicating with your internal sub-personalities ("parts"). The goal is to understand their positive intent and heal internal conflicts by fostering a relationship from the core Self.', importance: 8 },
    { id: 'shadow-archetypes', label: 'Shadow Archetypes', category: 'shadow', description: 'Universal, primal patterns of the unconscious mind, such as the Victim, the Saboteur, or the Prostitute. Identifying which archetypes are active in your shadow provides a powerful map for understanding your core patterns.', importance: 7 },
    { id: 'golden-shadow', label: 'Golden Shadow', category: 'shadow', description: 'The positive, brilliant qualities that you disown and project onto others through admiration or envy. Reclaiming your golden shadow involves recognizing and embodying these dormant strengths and potentials.', importance: 7 },
    { id: 'dark-shadow', label: 'Dark Shadow', category: 'shadow', description: 'The negative, "unacceptable" qualities that you repress and project onto others as blame or judgment. Integrating the dark shadow involves acknowledging these traits and understanding their protective function, leading to greater wholeness.', importance: 7 },
    { id: 'projection', label: 'Projection', category: 'shadow', description: 'An unconscious defense mechanism where you attribute your own unacceptable thoughts, feelings, or qualities to another person. The 3-2-1 process is a direct method for identifying and withdrawing these projections.', importance: 6 },
    { id: 'triggers', label: 'Triggers', category: 'shadow', description: 'An emotional reaction that is out of proportion to the current situation. Triggers are signals that an unhealed wound or an unintegrated shadow part has been activated, offering a direct doorway into shadow work.', importance: 6 },
    { id: 'defense-mechanisms', label: 'Defense Mechanisms', category: 'shadow', description: 'Unconscious psychological strategies used to cope with reality and maintain self-image. Becoming aware of your go-to defenses (like denial, rationalization, or projection) is a key part of shadow work.', importance: 6 },
    { id: 'inner-critic', label: 'Inner Critic', category: 'shadow', description: 'An internal voice that attacks, judges, and shames you. It is often a "manager" part (in IFS terms) that is trying to protect you by preventing you from making mistakes or being rejected, albeit with a harmful strategy.', importance: 7 },
    { id: 're-owning', label: 'Re-Owning', category: 'shadow', description: 'The process of consciously accepting and integrating a previously disowned part of yourself. This is the final and most crucial step of shadow work, turning a source of internal conflict into a source of strength.', importance: 6 },
    { id: 'shame', label: 'Shame', category: 'shadow', description: 'The painful feeling that you are fundamentally flawed or unworthy. Shame is often held by young, "exiled" parts of our system, and healing it is a central goal of deep shadow and trauma work.', importance: 6 },
    { id: 'envy', label: 'Envy', category: 'shadow', description: 'The painful feeling of wanting what another person has. In shadow work, envy is seen as a powerful signpost pointing directly to a disowned positive quality—your Golden Shadow—that is waiting to be reclaimed.', importance: 5 },
    { id: 'resentment', label: 'Resentment', category: 'shadow', description: 'The feeling of bitter indignation at having been treated unfairly. Resentment often indicates a boundary that was crossed or a need that was not met, and can be a doorway to understanding your values and asserting your needs.', importance: 5 },
    
    // ========== AQAL & INTEGRAL THEORY (15) ==========
    { id: 'aqal', label: 'AQAL Framework', category: 'integral', description: '"All Quadrants, All Levels," the core map of Integral Theory. It provides a comprehensive framework for understanding reality by considering the subjective (I), intersubjective (We), objective (It), and interobjective (Its) dimensions.', importance: 9 },
    { id: 'quadrants', label: 'Quadrants', category: 'integral', description: 'The four fundamental perspectives on any occasion: the "I" (subjective experience), "We" (intersubjective culture), "It" (objective behavior), and "Its" (interobjective systems). A truly integral approach considers all four.', importance: 8 },
    { id: 'levels', label: 'Levels of Development', category: 'integral', description: 'The stages of consciousness that individuals and cultures move through over time, such as those mapped by Spiral Dynamics or Kegan\'s Orders. These represent increasingly complex and inclusive worldviews.', importance: 8 },
    { id: 'lines', label: 'Lines of Development', category: 'integral', description: 'The multiple intelligences that develop through the levels, such as cognitive, emotional, interpersonal, and moral. People can be at different levels in different lines, creating a unique psycho-spiritual profile.', importance: 7 },
    { id: 'types', label: 'Types', category: 'integral', description: 'The enduring patterns or styles that can be present at any stage of development. This includes personality typologies like the Enneagram or masculine/feminine dynamics, which color how we experience each stage.', importance: 7 },
    { id: 'transcend-include', label: 'Transcend & Include', category: 'integral', description: 'The fundamental mechanism of evolution and development. Each new stage of growth must both go beyond ("transcend") the limitations of the previous stage while also incorporating ("including") its essential functions.', importance: 7 },
    { id: 'upper-left', label: 'Upper Left (I)', category: 'integral', description: 'The quadrant of individual, subjective experience. This is the realm of your personal thoughts, feelings, and immediate awareness. It is explored through practices like meditation and shadow work.', importance: 7 },
    { id: 'lower-left', label: 'Lower Left (We)', category: 'integral', description: 'The quadrant of collective, intersubjective culture. This is the realm of shared values, language, and relationships. It is explored through practices like perspective-taking and authentic communication.', importance: 7 },
    { id: 'upper-right', label: 'Upper Right (It)', category: 'integral', description: 'The quadrant of individual, objective behavior. This is the realm of what can be seen and measured from the outside, such as your body, brain, and observable actions. It is addressed through Body module practices.', importance: 7 },
    { id: 'lower-right', label: 'Lower Right (Its)', category: 'integral', description: 'The quadrant of collective, interobjective systems. This is the realm of social structures, economic forces, and environmental networks. It is the context in which all other quadrants exist.', importance: 7 },
    { id: 'integral-method-pluralism', label: 'Integral Methodological Pluralism', category: 'integral', description: 'The idea that each quadrant has its own valid ways of gathering knowledge. It advocates for using different methods (e.g., meditation for the UL, scientific method for the UR) to gain a more complete picture of reality.', importance: 6 },
    { id: 'pre-trans-fallacy', label: 'Pre/Trans Fallacy', category: 'integral', description: 'The common error of confusing pre-rational states (childlike, magical thinking) with trans-rational states (transcendent, non-dual awareness) because neither is purely rational. It\'s crucial to elevate, not regress.', importance: 6 },
    { id: 'fulcrums', label: 'Fulcrums of Self', category: 'integral', description: 'In developmental theory, a fulcrum represents a critical "1-2-3" process of growth. 1: Fusing with a new stage. 2: Differentiating from it. 3: Integrating it into a higher, more complex self-identity.', importance: 5 },
    { id: 'wilber-commons-lattice', label: 'Wilber-Commons Lattice', category: 'integral', description: 'An academic model that correlates stages of development (like Kegan\'s or Spiral Dynamics) with states of consciousness (like waking, dreaming, deep sleep), providing a highly detailed map of human potential.', importance: 5 },
    { id: 'integral-psychograph', label: 'Integral Psychograph', category: 'integral', description: 'A visual tool for mapping one\'s own development. It charts your estimated level of development across various lines (cognitive, emotional, etc.), revealing your unique strengths and areas for growth.', importance: 5 },
  ],
  links: [
    // ILP Core to Modules
    { source: 'ilp', target: 'body-module', value: 10 },
    { source: 'ilp', target: 'mind-module', value: 10 },
    { source: 'ilp', target: 'spirit-module', value: 10 },
    { source: 'ilp', target: 'shadow-module', value: 10 },
    
    // Body Module Connections
    { source: 'body-module', target: 'sleep', value: 10 },
    { source: 'body-module', target: 'resistance-training', value: 8 },
    { source: 'body-module', target: 'zone2-cardio', value: 8 },
    { source: 'body-module', target: 'nutrition', value: 8 },
    { source: 'body-module', target: '3-body-workout', value: 7 },
    { source: '3-body-workout', target: 'physical-body', value: 8 },
    { source: '3-body-workout', target: 'subtle-body', value: 8 },
    { source: '3-body-workout', target: 'causal-body', value: 8 },
    { source: 'physical-body', target: 'resistance-training', value: 8 },
    { source: 'subtle-body', target: 'breathwork', value: 8 },
    { source: 'subtle-body', target: 'yoga', value: 7 },
    { source: 'subtle-body', target: 'tai-chi', value: 6 },
    { source: 'subtle-body', target: 'qigong', value: 6 },
    { source: 'causal-body', target: 'meditation', value: 8 },
    { source: 'zone2-cardio', target: 'hrv', value: 7 },
    { source: 'zone2-cardio', target: 'mitochondria', value: 7 },
    { source: 'sleep', target: 'circadian', value: 9 },
    { source: 'sleep', target: 'recovery', value: 9 },
    { source: 'sleep', target: 'hormones', value: 8 },
    { source: 'nutrition', target: 'protein', value: 8 },
    { source: 'nutrition', target: 'micronutrients', value: 7 },
    { source: 'nutrition', target: 'hydration', value: 7 },
    { source: 'resistance-training', target: 'hormones', value: 7 },
    { source: 'resistance-training', target: 'protein', value: 7 },
    { source: 'breathwork', target: 'nervous-system', value: 8 },
    { source: 'hrv', target: 'nervous-system', value: 7 },
    { source: 'cold-exposure', target: 'nervous-system', value: 6 },
    { source: 'mobility', target: 'posture', value: 7 },
    
    // Mind Module Connections
    { source: 'mind-module', target: 'vertical', value: 9 },
    { source: 'mind-module', target: 'horizontal', value: 9 },
    { source: 'mind-module', target: 'cognitive-biases', value: 8 },
    { source: 'mind-module', target: 'metacognition', value: 8 },
    { source: 'vertical', target: 'kegan', value: 9 },
    { source: 'vertical', target: 'spiral-dynamics', value: 9 },
    { source: 'vertical', target: 'subject-object', value: 9 },
    { source: 'kegan', target: 'subject-object', value: 10 },
    { source: 'kegan', target: 'order3', value: 8 },
    { source: 'kegan', target: 'order4', value: 8 },
    { source: 'kegan', target: 'order5', value: 8 },
    { source: 'spiral-dynamics', target: 'blue', value: 7 },
    { source: 'spiral-dynamics', target: 'orange', value: 7 },
    { source: 'spiral-dynamics', target: 'green', value: 7 },
    { source: 'spiral-dynamics', target: 'yellow', value: 7 },
    { source: 'spiral-dynamics', target: 'second-tier', value: 8 },
    { source: 'yellow', target: 'second-tier', value: 9 },
    { source: 'horizontal', target: 'enneagram', value: 8 },
    { source: 'horizontal', target: 'ifs', value: 8 },
    { source: 'horizontal', target: 'mental-models', value: 8 },
    { source: 'ifs', target: 'self', value: 9 },
    { source: 'ifs', target: 'parts', value: 9 },
    { source: 'parts', target: 'managers', value: 8 },
    { source: 'parts', target: 'exiles', value: 8 },
    { source: 'yellow', target: 'systems-thinking', value: 8 },
    { source: 'systems-thinking', target: 'polarity', value: 7 },
    { source: 'vertical', target: 'perspective-taking', value: 7 },
    
    // Spirit Module Connections
    { source: 'spirit-module', target: 'meditation', value: 10 },
    { source: 'spirit-module', target: 'mindfulness', value: 9 },
    { source: 'spirit-module', target: 'witness', value: 9 },
    { source: 'spirit-module', target: 'gratitude', value: 8 },
    { source: 'spirit-module', target: 'states', value: 8 },
    { source: 'meditation', target: 'mindfulness', value: 9 },
    { source: 'meditation', target: 'witness', value: 9 },
    { source: 'meditation', target: 'presence', value: 9 },
    { source: 'meditation', target: 'equanimity', value: 8 },
    { source: 'meditation', target: 'mbsr', value: 7 },
    { source: 'witness', target: 'big-mind', value: 7 },
    { source: 'witness', target: '1st-person', value: 8 },
    { source: 'prayer', target: '2nd-person', value: 8 },
    { source: 'prayer', target: 'devotion', value: 8 },
    { source: 'contemplation', target: '3rd-person', value: 8 },
    { source: 'contemplation', target: 'meaning', value: 7 },
    { source: 'loving-kindness', target: 'devotion', value: 7 },
    { source: 'nature-exposure', target: 'awe', value: 7 },
    { source: 'states', target: 'transcendence', value: 7 },
    { source: 'stages', target: 'vertical', value: 9 },
    { source: 'states', target: 'stages', value: 8 },
    { source: 'service', target: 'devotion', value: 6 },
    
    // Shadow Module Connections
    { source: 'shadow-module', target: '3-2-1', value: 9 },
    { source: 'shadow-module', target: 'parts-dialogue', value: 9 },
    { source: 'shadow-module', target: 'shadow-journaling', value: 8 },
    { source: 'shadow-module', target: 'self-compassion-break', value: 8 },
    { source: 'shadow-module', target: 'projection', value: 8 },
    { source: '3-2-1', target: 'projection', value: 9 },
    { source: '3-2-1', target: 're-owning', value: 8 },
    { source: 'parts-dialogue', target: 'ifs', value: 10 },
    { source: 'self-compassion-break', target: 'inner-critic', value: 8 },
    { source: 'self-compassion-break', target: 'shame', value: 8 },
    { source: 'shadow-archetypes', target: 'inner-critic', value: 7 },
    { source: 'projection', target: 'dark-shadow', value: 8 },
    { source: 'projection', target: 'golden-shadow', value: 8 },
    { source: 'triggers', target: 'defense-mechanisms', value: 8 },
    { source: 'envy', target: 'golden-shadow', value: 7 },
    { source: 'resentment', target: 'triggers', value: 7 },
    
    // AQAL & Integral Theory Connections
    { source: 'aqal', target: 'quadrants', value: 10 },
    { source: 'aqal', target: 'levels', value: 10 },
    { source: 'aqal', target: 'lines', value: 10 },
    { source: 'aqal', target: 'states', value: 10 },
    { source: 'aqal', target: 'types', value: 10 },
    { source: 'quadrants', target: 'upper-left', value: 9 },
    { source: 'quadrants', target: 'lower-left', value: 9 },
    { source: 'quadrants', target: 'upper-right', value: 9 },
    { source: 'quadrants', target: 'lower-right', value: 9 },
    { source: 'levels', target: 'vertical', value: 10 },
    { source: 'types', target: 'enneagram', value: 8 },
    { source: 'ilp', target: 'aqal', value: 9 },
    { source: 'vertical', target: 'transcend-include', value: 8 },
    { source: 'upper-left', target: 'spirit-module', value: 8 },
    { source: 'upper-left', target: 'shadow-module', value: 8 },
    { source: 'upper-right', target: 'body-module', value: 8 },
    { source: 'lower-left', target: 'perspective-taking', value: 7 },
    { source: 'lower-right', target: 'systems-thinking', value: 7 },
    { source: 'integral-method-pluralism', target: 'quadrants', value: 8 },
    { source: 'pre-trans-fallacy', target: 'levels', value: 7 },
    { source: 'fulcrums', target: 'kegan', value: 7 },
    { source: 'wilber-commons-lattice', target: 'levels', value: 6 },
    { source: 'wilber-commons-lattice', target: 'states', value: 6 },
    { source: 'integral-psychograph', target: 'lines', value: 7 },
    
    // Cross-Module Connections
    { source: 'body-module', target: 'spirit-module', value: 5 }, // Embodied spirituality
    { source: 'sleep', target: 'mind-module', value: 7 }, // Sleep for cognition
    { source: 'meditation', target: 'nervous-system', value: 7 },
    { source: 'shadow-module', target: 'mind-module', value: 6 }, // psychological models
    { source: 'ifs', target: 'shadow-module', value: 8 },
    { source: 'subject-object', target: 'shadow-module', value: 7 },
  ],
};


export const ILPKnowledgeGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const linkRef = useRef<Selection<SVGLineElement, Link, SVGGElement, unknown> | null>(null);
  const nodeRef = useRef<Selection<SVGGElement, Node, SVGGElement, unknown> | null>(null);
  const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [activeNode, setActiveNode] = useState<Node | null>(null);

  // Deep copy nodes and links to ensure they are mutable within D3
  const nodes: Node[] = useRef(JSON.parse(JSON.stringify(graphData.nodes))).current;
  const links: Link[] = useRef(JSON.parse(JSON.stringify(graphData.links))).current;

  const categoryColors: Record<string, string> = {
    core: '#d9aaef',
    body: '#10b981',
    mind: '#3b82f6',
    spirit: '#8b5cf6',
    shadow: '#f59e0b',
    integral: '#f43f5e'
  };

  // Memoize connected nodes/links for efficient lookup
  const getConnections = useCallback((nodeId: string) => {
    const connectedNodes = new Set<string>();
    const connectedLinks = new Set<string>();

    connectedNodes.add(nodeId); // The node itself is connected

    links.forEach(l => {
      const sourceNode = l.source as Node;
      const targetNode = l.target as Node;

      if (sourceNode.id === nodeId) {
        connectedNodes.add(targetNode.id);
        connectedLinks.add(`${sourceNode.id}-${targetNode.id}`);
      } else if (targetNode.id === nodeId) {
        connectedNodes.add(sourceNode.id);
        connectedLinks.add(`${targetNode.id}-${sourceNode.id}`); // Add reverse for easy lookup
      }
    });
    return { connectedNodes, connectedLinks };
  }, [links]);

  useEffect(() => {
    const width = 800;
    const height = 600;

    const simulation = forceSimulation(nodes)
      .force('link', forceLink(links).id((d: any) => d.id).distance(d => 150 - d.value * 10))
      .force('charge', forceManyBody().strength(-150))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide().radius((d: any) => d.importance * 2.5 + 5));
    
    simulationRef.current = simulation;

    const svg: Selection<SVGSVGElement, unknown, BaseType, undefined> = select(svgRef.current!)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('class', 'rounded-lg'); // Add class for styling

    // Clear existing elements to prevent duplicates on re-render in dev mode
    svg.selectAll('g').remove();

    const container = svg.append('g');

    linkRef.current = container.append('g')
      .attr('stroke-opacity', 0.6) // Increased opacity for better visibility
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#475569')
      .attr('stroke-width', d => Math.sqrt(d.value) * 1); // Increased width for better visibility

    nodeRef.current = container.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node-group cursor-pointer');
      
    nodeRef.current.append('circle')
        .attr('r', d => d.importance * 1.5 + 4)
        .attr('fill', d => categoryColors[d.category] || '#94a3b8')
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 2);

    nodeRef.current.append('text')
        .text(d => d.label)
        .attr('x', d => d.importance * 1.5 + 8)
        .attr('y', 4)
        .attr('class', 'text-xs font-sans pointer-events-none') // Disable pointer events on text so clicks go to circle
        .attr('fill', '#cbd5e1');

    // Node click handler
    nodeRef.current.on('click', (event, d) => {
        event.stopPropagation(); // Prevent the SVG background click from firing
        setActiveNode(prev => (prev && prev.id === d.id ? null : d as Node));
    });

    // SVG background click handler
    svg.on('click', () => setActiveNode(null));

    nodeRef.current.call(drag<any, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    simulation.on('tick', () => {
      linkRef.current!
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeRef.current!.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    const zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> = zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 5])
        .on('zoom', (event) => {
            container.attr('transform', event.transform);
        });
    
    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior);

    function dragstarted(event: any, d: Node) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: Node) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: Node) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Zoom controls - re-attach to SVG's parent
    const controlsContainer = select(svgRef.current!.parentElement!).select('.graph-controls');
    if (controlsContainer.empty()) {
        const controls = select(svgRef.current!.parentElement!).append('div')
            .attr('class', 'graph-controls absolute bottom-2 right-2 flex flex-col gap-1');

        controls.append('button')
            .attr('class', 'bg-slate-700/50 p-1.5 rounded-md text-slate-300 hover:bg-slate-700')
            .on('click', () => svg.transition().call(zoomBehavior.scaleBy, 1.2))
            .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`);
        
        controls.append('button')
            .attr('class', 'bg-slate-700/50 p-1.5 rounded-md text-slate-300 hover:bg-slate-700')
            .on('click', () => svg.transition().call(zoomBehavior.scaleBy, 0.8))
            .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`);

        controls.append('button')
            .attr('class', 'bg-slate-700/50 p-1.5 rounded-md text-slate-300 hover:bg-slate-700 mt-1')
            .on('click', () => svg.transition().call(zoomBehavior.transform, zoomIdentity))
            .html(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 1v6h6"/><path d="M23 23v-6h-6"/><path d="M1 7l5-5"/><path d="M23 17l-5 5"/></svg>`);
    }


    return () => {
      simulation.stop();
      // Only remove if this component is truly unmounting to avoid issues with hot-reloading
      // In production, this cleanup is more straightforward.
      if (svgRef.current) {
        select(svgRef.current).selectAll('*').remove();
        select(svgRef.current!.parentElement!).select('.graph-controls').remove();
      }
    };
  }, []); // Run only once on mount

  // Effect for handling active node highlighting
  useEffect(() => {
    if (!nodeRef.current || !linkRef.current) return;

    if (activeNode) {
      const { connectedNodes, connectedLinks } = getConnections(activeNode.id);

      // Update node styles
      nodeRef.current.selectAll('circle')
        .transition().duration(200)
        .attr('stroke', d => connectedNodes.has((d as Node).id) ? '#d9aaef' : '#1e293b') // Highlighted border
        .attr('stroke-width', d => (d as Node).id === activeNode.id ? 4 : (connectedNodes.has((d as Node).id) ? 3 : 2)) // Thicker border for active, slightly thicker for connected
        .attr('opacity', d => connectedNodes.has((d as Node).id) ? 1 : 0.4); // Fade others

      nodeRef.current.selectAll('text')
          .transition().duration(200)
          .attr('opacity', d => connectedNodes.has((d as Node).id) ? 1 : 0.4)
          .attr('fill', d => (d as Node).id === activeNode.id ? '#d9aaef' : '#cbd5e1'); // Active node text brighter

      // Update link styles
      linkRef.current
        .transition().duration(200)
        .attr('stroke', d => {
          const sourceId = (d.source as Node).id;
          const targetId = (d.target as Node).id;
          return (
            (connectedLinks.has(`${sourceId}-${targetId}`) || connectedLinks.has(`${targetId}-${sourceId}`)) &&
            (connectedNodes.has(sourceId) && connectedNodes.has(targetId))
          ) ? '#d9aaef' : '#475569';
        })
        .attr('stroke-width', d => {
          const sourceId = (d.source as Node).id;
          const targetId = (d.target as Node).id;
          return (
            (connectedLinks.has(`${sourceId}-${targetId}`) || connectedLinks.has(`${targetId}-${sourceId}`)) &&
            (connectedNodes.has(sourceId) && connectedNodes.has(targetId))
          ) ? 2 : 1; // Thicker link
        })
        .attr('opacity', d => {
          const sourceId = (d.source as Node).id;
          const targetId = (d.target as Node).id;
          return (
            (connectedLinks.has(`${sourceId}-${targetId}`) || connectedLinks.has(`${targetId}-${sourceId}`)) &&
            (connectedNodes.has(sourceId) && connectedNodes.has(targetId))
          ) ? 1 : 0.2; // Fade others
        });

    } else {
      // Reset styles when no node is active
      nodeRef.current.selectAll('circle')
        .transition().duration(200)
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 2)
        .attr('opacity', 1);

      nodeRef.current.selectAll('text')
          .transition().duration(200)
          .attr('opacity', 1)
          .attr('fill', '#cbd5e1');

      linkRef.current
        .transition().duration(200)
        .attr('stroke', '#475569')
        .attr('stroke-width', 1)
        .attr('opacity', 0.6); // Original opacity
    }
  }, [activeNode, getConnections]);


  return (
    <div className="w-full bg-slate-900/50 rounded-lg border border-slate-700 shadow-lg relative">
        <svg ref={svgRef} className="w-full h-auto" style={{ minHeight: '600px' }}></svg>
        {activeNode && (
            <div className="absolute top-2 left-2 bg-slate-800/80 backdrop-blur-sm border border-slate-700 p-4 rounded-lg max-w-sm w-full animate-fade-in shadow-xl">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg" style={{ color: categoryColors[activeNode.category] || '#cbd5e1' }}>
                            {activeNode.label}
                        </h3>
                        <p className="text-xs font-mono uppercase text-slate-400">{activeNode.category}</p>
                    </div>
                    <button onClick={() => setActiveNode(null)} className="text-slate-500 hover:text-slate-300"><X size={18}/></button>
                </div>
                <p className="text-sm text-slate-300 mt-2">{activeNode.description}</p>
            </div>
        )}
    </div>
  );
};